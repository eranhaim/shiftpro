import asyncio
import base64
import io
import os
import shutil
from contextlib import asynccontextmanager

import qrcode
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pyaileys import WhatsAppClient

AUTH_FOLDER = "./auth"

wa_client: WhatsAppClient | None = None
auth_state = None
qr_string: str | None = None
connected: bool = False
phone_number: str | None = None


def on_connection_update(update):
    global qr_string, connected, phone_number
    if update.qr:
        qr_string = update.qr
    if update.connection == "open":
        connected = True
        qr_string = None
    elif update.connection == "close":
        connected = False
        phone_number = None


async def on_creds_update(_creds):
    if auth_state:
        await auth_state.save_creds()


async def init_client():
    global wa_client, auth_state
    client, state = await WhatsAppClient.from_auth_folder(AUTH_FOLDER)
    wa_client = client
    auth_state = state
    client.on("connection.update", on_connection_update)
    client.on("creds.update", on_creds_update)
    return client


async def try_auto_connect():
    if os.path.exists(AUTH_FOLDER) and os.listdir(AUTH_FOLDER):
        try:
            client = await init_client()
            await client.connect()
        except Exception as e:
            print(f"Auto-connect failed: {e}")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    asyncio.create_task(try_auto_connect())
    yield
    if wa_client:
        try:
            await wa_client.disconnect()
        except Exception:
            pass


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SendRequest(BaseModel):
    phone: str
    message: str


class BroadcastRequest(BaseModel):
    phones: list[str]
    message: str


@app.get("/status")
async def status():
    return {"connected": connected, "phone": phone_number}


@app.get("/qr")
async def get_qr():
    if connected:
        return {"qr": None}
    if not qr_string:
        return {"qr": None}

    img = qrcode.make(qr_string)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    b64 = base64.b64encode(buffer.read()).decode("utf-8")
    return {"qr": f"data:image/png;base64,{b64}"}


def to_jid(phone: str) -> str:
    digits = "".join(c for c in phone if c.isdigit())
    if digits.startswith("0"):
        digits = "972" + digits[1:]
    return digits + "@s.whatsapp.net"


@app.post("/connect")
async def connect_wa():
    global qr_string, connected, phone_number
    if connected and wa_client:
        return {"message": "Already connected"}

    qr_string = None
    connected = False
    phone_number = None

    try:
        client = await init_client()
        asyncio.create_task(client.connect())
        return {"message": "Connecting... QR code will be available shortly"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/send")
async def send(req: SendRequest):
    if not connected or not wa_client:
        raise HTTPException(status_code=400, detail="WhatsApp not connected")
    try:
        jid = to_jid(req.phone)
        await wa_client.send_text(jid, req.message)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/broadcast")
async def broadcast(req: BroadcastRequest):
    if not connected or not wa_client:
        raise HTTPException(status_code=400, detail="WhatsApp not connected")

    results = []
    for phone in req.phones:
        try:
            jid = to_jid(phone)
            await wa_client.send_text(jid, req.message)
            results.append({"phone": phone, "success": True})
        except Exception as e:
            results.append({"phone": phone, "success": False, "error": str(e)})
        await asyncio.sleep(0.5)

    sent = sum(1 for r in results if r["success"])
    return {"sent": sent, "total": len(req.phones), "results": results}


@app.post("/disconnect")
async def disconnect_wa():
    global wa_client, auth_state, connected, phone_number, qr_string
    if wa_client:
        try:
            await wa_client.disconnect()
        except Exception:
            pass
    wa_client = None
    auth_state = None
    connected = False
    phone_number = None
    qr_string = None

    if os.path.exists(AUTH_FOLDER):
        shutil.rmtree(AUTH_FOLDER, ignore_errors=True)

    return {"message": "Disconnected and session cleared"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=4001, reload=True)
