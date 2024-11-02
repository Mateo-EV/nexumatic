import { type Connection } from "../db/schema";

export class ExternalService {
  public connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }
}
