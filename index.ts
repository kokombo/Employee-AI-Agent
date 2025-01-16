import "dotenv/config";
import express from "express";
import type { Express, Request, Response } from "express";
import { MongoClient } from "mongodb";
import { callAgent } from "./agent";

const app: Express = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_ATLAS_URI as string);

const startServer = async () => {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB Atlas successfully!");

    app.get("/", (req: Request, res: Response) => {
      res.send("LangGraph Agent Server");
    });

    app.post("/chat", async (req: Request, res: Response) => {
      const initialMessage = req.body.message;
      const threadId = Date.now().toString();

      try {
        const response = await callAgent(client, initialMessage, threadId);
        res.json({ threadId, response });
      } catch (error) {
        console.error("Error during agent interaction:", error);
        res.status(500).json({ error: "An error occurred" });
      }
    });

    app.post("/chat/:threadId", async (req: Request, res: Response) => {
      const { threadId } = req.params;
      const { message } = req.body;

      try {
        const response = await callAgent(client, message, threadId);
        res.json(response);
      } catch (error) {
        console.error("Error in chat:", error);
        res.status(500).json({ error: "An error occurred" });
      }
    });

    const PORT = process.env.PORT || 3003;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

startServer();
