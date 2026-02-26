import { AccessToken, EgressClient, EncodedFileOutput, EncodedFileType, RoomServiceClient } from "livekit-server-sdk";

export function getLiveKitRoomService() {
  const url = process.env.LIVEKIT_URL!;
  const apiKey = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;
  return new RoomServiceClient(url, apiKey, apiSecret);
}

export async function createParticipantToken({
  roomName,
  participantName,
  participantId,
  canPublish = true,
  canSubscribe = true,
  canPublishData = true,
}: {
  roomName: string;
  participantName: string;
  participantId: string;
  canPublish?: boolean;
  canSubscribe?: boolean;
  canPublishData?: boolean;
}): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantId,
    name: participantName,
    ttl: "4h",
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish,
    canSubscribe,
    canPublishData,
    canUpdateOwnMetadata: true,
  });

  return await at.toJwt();
}

function getEgressClient() {
  const url = process.env.LIVEKIT_URL!;
  const apiKey = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;
  return new EgressClient(url, apiKey, apiSecret);
}

export async function startRoomEgress(roomName: string): Promise<string> {
  const egressClient = getEgressClient();
  const output = new EncodedFileOutput({
    fileType: EncodedFileType.MP4,
    filepath: `recordings/${roomName}-{time}.mp4`,
  });
  const egress = await egressClient.startRoomCompositeEgress(roomName, output);
  return egress.egressId;
}

export async function stopEgress(egressId: string): Promise<void> {
  const egressClient = getEgressClient();
  await egressClient.stopEgress(egressId);
}
