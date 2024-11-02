import { env } from "@/env";
import { type Connection } from "../db/schema";
import axios from "axios";

type GoogleOauthResponse = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
};

export class GoogleDriveService {
  public connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  public async refreshAccessToken() {
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

    console.log(response.data);

    return response.data.startPageToken;
  }
}
