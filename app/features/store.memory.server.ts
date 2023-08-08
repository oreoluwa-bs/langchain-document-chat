import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import {
  JSONLoader,
  //   JSONLinesLoader,
} from "langchain/document_loaders/fs/json";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { EPubLoader } from "langchain/document_loaders/fs/epub";
// import { BufferLoader } from "langchain/document_loaders/fs/buffer";

import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

import { Tiktoken } from "@dqbd/tiktoken/lite";
import { load } from "@dqbd/tiktoken/load";
import registry from "@dqbd/tiktoken/registry.json";
import models from "@dqbd/tiktoken/model_to_encoding.json";
// import { type Document } from "langchain/dist/document";
import { OpenAI } from "langchain/llms/openai";
import { RetrievalQAChain } from "langchain/chains";
// import { GooglePaLM } from "langchain/llms/googlepalm";

const doc_loader = new DirectoryLoader("public/documents", {
  ".json": (path) => new JSONLoader(path),
  // ".jsonl":(path)=>new JSONLinesLoader(path),
  ".txt": (path) => new TextLoader(path),
  ".csv": (path) => new CSVLoader(path),
  ".pdf": (path) => new PDFLoader(path),
  ".epub": (path) => new EPubLoader(path),
});

export async function loadDocs() {
  const docs = await doc_loader.load();

  return docs;
}

let main_model: any = null;

async function calculateCost() {
  const modelName: keyof typeof models = "gpt-3.5-turbo";
  const modelKey = models[modelName];

  //   @ts-ignore
  const model = main_model ?? (await load(registry[modelKey]));
  main_model = model;

  const encoder = new Tiktoken(
    model.bpe_ranks,
    model.special_tokens,
    model.pat_str
  );

  const tokens = encoder.encode(JSON.stringify(await loadDocs()));

  const tokenCount = tokens.length;
  const ratePerThousandTokens = 0.0004;
  const cost = (tokenCount / 1000) * ratePerThousandTokens;

  encoder.free();

  return cost;
}

// function normalizeDocuments(docs: Document<Record<string, any>>[]) {
//   return docs.map((doc) => {
//     if (typeof doc.pageContent === "string") {
//       return doc.pageContent;
//     } else if (Array.isArray(doc.pageContent)) {
//       const j = doc.pageContent as string[];
//       return j.join("\n");
//     }
//   });
// }

let vectorStore: MemoryVectorStore | null = null;

export async function run(prompt: string) {
  const cost = await calculateCost();

  console.log("cost", cost);
  if (cost <= 1) {
    const model = new OpenAI({
      openAIApiKey: process.env.OPEN_API_SECRET_KEY,
      modelName: "gpt-3.5-turbo",
    });

    // console.log("v", vectorStore);
    if (vectorStore) {
      const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

      const result = await chain.call({ query: prompt });

      return result;
    } else {
      const docs = await loadDocs();
      vectorStore = await MemoryVectorStore.fromDocuments(
        docs,
        new OpenAIEmbeddings({
          openAIApiKey: process.env.OPEN_API_SECRET_KEY,
        })
      );

      const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

      const result = await chain.call({ query: prompt });
      console.log("r", result);

      return result;
    }
  } else {
    throw new Error("Above $1 Cost");
  }
}

export async function updateVectorStore() {
  const docs = await loadDocs();

  vectorStore = await MemoryVectorStore.fromDocuments(
    docs,
    new OpenAIEmbeddings({
      openAIApiKey: process.env.OPEN_API_SECRET_KEY,
    })
  );

  return vectorStore;
}
