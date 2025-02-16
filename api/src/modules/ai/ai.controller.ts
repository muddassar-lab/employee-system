import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import OpenAI from "openai";
import { db } from "../../utils/db";
import { transactions } from "../transaction/transaction.schema";

export default class AiController {
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      // baseURL: "https://api.deepseek.com"
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
  }

  async accountant(req: Request, res: Response) {
    try {
      const { query } = req.body;

      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const userId = req.user.id;

      const data = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId));

      if (data.length === 0) {
        return res.status(400).json({ error: "No transactions found" });
      }

      const formattedTxns = data.map((txn) => ({
        amount: txn.amount,
        txnType: txn.txnType,
        summary: txn.summary,
        tag: txn.tag,
        date: txn.createdAt,
      }));

      const prompt = `
    You are a personal accountant. You are given a list of transactions. You need to answer user query based on the transactions. 

    YOU MUST KEEP THESE POINTS IN MIND WHILE ANSWERING THE USER QUERY:
    1. You must give straight forward answer.
    2. Answer like you are talking to the user. 
    3. You must not output your thinking process and reasoning. This is very important.
    4. Answer should be in markdown format.

    Transactions: ${JSON.stringify(formattedTxns)}
    Currency: $ (USD)

    User Query: ${query}
    `;

      const response = await this.openai.chat.completions.create({
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        stream: true,
      });

      res.writeHead(200, {
        "Content-Type": "text/plain",
        "transfer-encoding": "chunked",
      });

      for await (const chunk of response) {
        if (chunk.choices[0].finish_reason === "stop") {
          break;
        }

        res.write(chunk.choices[0].delta.content || "");
      }

      res.end();
    } catch (error) {
      console.error({ error });
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
}
