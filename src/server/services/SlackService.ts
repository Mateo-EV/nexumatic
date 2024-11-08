import axios from "axios";
import { type Connection } from "../db/schema";
import { ExternalService } from "./ExternalService";

export class SlackService extends ExternalService {
  constructor(connection: Connection) {
    super(connection);
  }

  public async getChannels() {
    try {
      const response = await axios.get<{
        ok: boolean;
        channels: {
          id: string;
          name: string;
          is_channel: boolean;
          is_group: boolean;
        }[];
      }>("https://slack.com/api/users.conversations", {
        headers: {
          Authorization: `Bearer ${this.connection.accessToken}`,
        },
        params: {
          types: "public_channel,private_channel",
          limit: "200",
        },
      });

      if (!response.data.ok) throw new Error("");

      return response.data.channels;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(error.response?.data);
      } else {
        console.log(error);
      }

      throw error;
    }
  }
}
