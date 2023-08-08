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

// import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { PrismaVectorStore } from "langchain/vectorstores/prisma";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { type Document } from "langchain/dist/document";
import { RetrievalQAChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { Tiktoken } from "@dqbd/tiktoken/lite";
import { load } from "@dqbd/tiktoken/load";
import registry from "@dqbd/tiktoken/registry.json";
import models from "@dqbd/tiktoken/model_to_encoding.json";

import { Prisma } from "@prisma/client";
import { db } from "~/db.server";
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

  const docs = (await createVectorStore()).contentColumn;

  console.log("docdd", docs);

  const tokens = encoder.encode(docs);

  const tokenCount = tokens.length;
  const ratePerThousandTokens = 0.0004;
  const cost = (tokenCount / 1000) * ratePerThousandTokens;

  encoder.free();

  return cost;
}

function normalizeDocuments(docs: Document<Record<string, any>>[]) {
  return docs.map((doc) => normalizeDocument(doc));
}

function normalizeDocument(doc: Document<Record<string, any>>) {
  if (typeof doc.pageContent === "string") {
    return doc.pageContent;
  } else if (Array.isArray(doc.pageContent)) {
    const j = doc.pageContent as string[];
    return j.join("\n");
  }
}

async function createVectorStore() {
  return PrismaVectorStore.withModel(db).create(
    new OpenAIEmbeddings({
      openAIApiKey: process.env.OPEN_API_SECRET_KEY,
    }),
    {
      // @ts-ignore
      prisma: Prisma,
      tableName: "Document",
      vectorColumnName: "embedding",
      columns: {
        id: PrismaVectorStore.IdColumn,
        content: PrismaVectorStore.ContentColumn,
      },
    }
  );
}

export async function run(prompt: string) {
  // const cost = await calculateCost();

  // console.log("cost", cost);
  // if (cost <= 1) {
  const model = new OpenAI({
    openAIApiKey: process.env.OPEN_API_SECRET_KEY,
    modelName: "gpt-3.5-turbo",
  });

  const vectorStore = await createVectorStore();

  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

  const result = await chain.call({ query: prompt });

  return result;
  // } else {
  //   throw new Error("Above $1 Cost");
  // }
}

export async function updateVectorStore(blob: File) {
  const doc_loader = handleLoader("pdf", blob);

  const text_splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
  });

  const new_doc = await doc_loader.loadAndSplit(text_splitter);

  // vectorStore = await MemoryVectorStore.fromDocuments(
  //   docs,
  //   new OpenAIEmbeddings({
  //     openAIApiKey: process.env.OPEN_API_SECRET_KEY,
  //   })
  // );

  // const text_splitter = new RecursiveCharacterTextSplitter({
  //   chunkSize:1000,
  // });

  // const normalizedDocument = normalizeDocuments(new_doc) as string[];
  // const splitDocs = await text_splitter.createDocuments(normalizedDocument );

  const vectorStore = await createVectorStore();

  await vectorStore.addModels(
    await db.$transaction([
      db.document.create({
        data: {
          filename: blob.name,
          content: JSON.stringify(normalizeDocuments(new_doc)),
        },
      }),
    ])
  );

  // return normalizeDocuments(new_doc);

  return vectorStore;
}

function handleLoader(type: string, file: File) {
  switch (type) {
    case "pdf":
      return new PDFLoader(file);

    default:
      throw new Error("Unable to Load File");
  }
}
