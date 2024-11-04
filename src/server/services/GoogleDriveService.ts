import { env } from "@/env";
import { type Connection } from "../db/schema";
import axios from "axios";
import { ExternalService } from "./ExternalService";
import { updateConnection } from "../db/data";

type GoogleOauthResponse = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
};

export class GoogleDriveService extends ExternalService {
  constructor(connection: Connection) {
    super(connection);
  }

  public async init() {
    const now = new Date();

    if (this.connection.expiresAt! <= now) {
      const { access_token, expires_in, refresh_token } =
        await this.refreshAccessToken();

      const newConnection = await updateConnection({
        access_token,
        expires_in,
        refresh_token,
        connectionId: this.connection.id,
      });

      this.connection = newConnection;
    }
  }

  private async refreshAccessToken() {
    const data = new URLSearchParams({
      client_id: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID, // ID del cliente de Google
      client_secret: env.GOOGLE_CLIENT_SECRET, // Secreto del cliente de Google
      refresh_token: this.connection.refreshToken!,
      grant_type: "refresh_token",
    });

    const response = await axios.post<GoogleOauthResponse>(
      "https://oauth2.googleapis.com/token",
      data,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    return response.data;
  }

  public async getStartPageToken() {
    const response = await axios.get<{ startPageToken: string }>(
      "https://www.googleapis.com/drive/v3/changes/startPageToken",
      {
        headers: { Authorization: `Bearer ${this.connection.accessToken}` },
      },
    );

    return response.data.startPageToken;
  }

  public async createOrUpdateListener(
    startPageToken: string,
    existingId?: string,
  ) {
    const channelId = existingId ?? crypto.randomUUID();
    const response = await axios.post<{
      id: string;
      resourceId: string;
      resourceUri: string;
      expiration: string;
    }>(
      `https://www.googleapis.com/drive/v3/changes/watch?pageToken=${startPageToken}`,
      {
        kind: "api#channel",
        id: channelId, // Identificador único del canal
        type: "web_hook",
        address: `https://6ef6-2800-200-f488-914a-e43e-f4a-aedb-462a.ngrok-free.app/api/notifications/drive`, // URL pública
      },
      { headers: { Authorization: `Bearer ${this.connection.accessToken}` } },
    );

    return response.data;
  }

  public async deleteListener(channelId: string, resourceId: string) {
    await axios.post(
      "https://www.googleapis.com/drive/v3/channels/stop",
      {
        id: channelId,
        resourceId: resourceId,
      },
      { headers: { Authorization: `Bearer ${this.connection.accessToken}` } },
    );
  }
}
