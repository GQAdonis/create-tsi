// SPDX-FileCopyrightText: 2024 Deutsche Telekom AG, LlamaIndex, Vercel, Inc.
//
// SPDX-License-Identifier: MIT

import fs from "fs/promises";
import path from "path";
import {
  TemplateDataSource,
  TemplateFramework,
  TemplateVectorDB,
} from "./types";

type EnvVar = {
  name?: string;
  description?: string;
  value?: string;
};

const renderEnvVar = (envVars: EnvVar[]): string => {
  return envVars.reduce(
    (prev, env) =>
      prev +
      (env.description
        ? `# ${env.description.replaceAll("\n", "\n# ")}\n`
        : "") +
      (env.name
        ? env.value
          ? `${env.name}=${env.value}\n\n`
          : `# ${env.name}=\n\n`
        : ""),
    "",
  );
};

const getVectorDBEnvs = (vectorDb: TemplateVectorDB) => {
  switch (vectorDb) {
    case "mongo":
      return [
        {
          name: "MONGO_URI",
          description:
            "For generating a connection URI, see https://docs.timescale.com/use-timescale/latest/services/create-a-service\nThe MongoDB connection URI.",
        },
        {
          name: "MONGODB_DATABASE",
        },
        {
          name: "MONGODB_VECTORS",
        },
        {
          name: "MONGODB_VECTOR_INDEX",
        },
      ];
    case "pg":
      return [
        {
          name: "PG_CONNECTION_STRING",
          description:
            "For generating a connection URI, see https://docs.timescale.com/use-timescale/latest/services/create-a-service\nThe PostgreSQL connection string.",
        },
      ];

    case "pinecone":
      return [
        {
          name: "PINECONE_API_KEY",
          description:
            "Configuration for Pinecone vector store\nThe Pinecone API key.",
        },
        {
          name: "PINECONE_ENVIRONMENT",
        },
        {
          name: "PINECONE_INDEX_NAME",
        },
      ];
    case "milvus":
      return [
        {
          name: "MILVUS_ADDRESS",
          description:
            "The address of the Milvus server. Eg: http://localhost:19530",
          value: "http://localhost:19530",
        },
        {
          name: "MILVUS_COLLECTION",
          description:
            "The name of the Milvus collection to store the vectors.",
          value: "llamacollection",
        },
        {
          name: "MILVUS_USERNAME",
          description: "The username to access the Milvus server.",
        },
        {
          name: "MILVUS_PASSWORD",
          description: "The password to access the Milvus server.",
        },
      ];
    default:
      return [];
  }
};

export const createBackendEnvFile = async (
  root: string,
  opts: {
    openAiKey?: string;
    llamaCloudKey?: string;
    vectorDb?: TemplateVectorDB;
    model?: string;
    embeddingModel?: string;
    framework?: TemplateFramework;
    dataSources?: TemplateDataSource[];
    port?: number;
  },
) => {
  // Init env values
  const envFileName = ".env";
  const defaultEnvs = [
    {
      render: true,
      name: "MODEL",
      description: "The name of LLM model to use.",
      value: opts.model || "gpt-3.5-turbo",
    },
    {
      render: true,
      name: "TSI_API_KEY",
      description: "The T-Systems API key to use.",
      value: opts.openAiKey,
    },
    {
      name: "TSI_API_BASE_URL",
      description: "The T-Systems API base URL.",
      value: "https://llm-server.llmhub.t-systems.net/v2",
    },
    {
      name: "TSI_EMBED_API_BASE_URL",
      description: "The T-Systems embedding API base URL.",
      value: "https://llm-server.llmhub.t-systems.net/v2",
    },
    {
      name: "LLAMA_CLOUD_API_KEY",
      description: `The Llama Cloud API key.`,
      value: opts.llamaCloudKey,
    },
    // Add vector database environment variables
    ...(opts.vectorDb ? getVectorDBEnvs(opts.vectorDb) : []),
  ];
  let envVars: EnvVar[] = [];
  if (opts.framework === "fastapi") {
    envVars = [
      ...defaultEnvs,
      ...[
        {
          name: "APP_HOST",
          description: "The address to start the backend app.",
          value: "0.0.0.0",
        },
        {
          name: "APP_PORT",
          description: "The port to start the backend app.",
          value: opts.port?.toString() || "8000",
        },
        {
          name: "EMBEDDING_MODEL",
          description: "Name of the embedding model to use.",
          value: opts.embeddingModel,
        },
        {
          name: "EMBEDDING_DIM",
          description: "Dimension of the embedding model to use.",
        },
        {
          name: "LLM_TEMPERATURE",
          description: "Temperature for sampling from the model.",
        },
        {
          name: "LLM_MAX_TOKENS",
          description: "Maximum number of tokens to generate.",
        },
        {
          name: "TOP_K",
          description:
            "The number of similar embeddings to return when retrieving documents.",
          value: "3",
        },
        {
          name: "SYSTEM_PROMPT",
          description: `Custom system prompt.
Example:
SYSTEM_PROMPT="
We have provided context information below.
---------------------
{context_str}
---------------------
Given this information, please answer the question: {query_str}
"`,
        },
      ],
    ];
  } else {
    envVars = [
      ...defaultEnvs,
      ...[
        opts.framework === "nextjs"
          ? {
              name: "NEXT_PUBLIC_MODEL",
              description:
                "The LLM model to use (hardcode to front-end artifact).",
              value: opts.model || "gpt-3.5-turbo",
            }
          : {},
      ],
    ];
  }
  // Render and write env file
  const content = renderEnvVar(envVars);
  await fs.writeFile(path.join(root, envFileName), content);
  console.log(`Created '${envFileName}' file. Please check the settings.`);
};

export const createFrontendEnvFile = async (
  root: string,
  opts: {
    customApiPath?: string;
    model?: string;
  },
) => {
  const defaultFrontendEnvs = [
    {
      name: "MODEL",
      description: "The OpenAI model to use.",
      value: opts.model,
    },
    {
      name: "NEXT_PUBLIC_MODEL",
      description: "The OpenAI model to use (hardcode to front-end artifact).",
      value: opts.model,
    },
    {
      name: "NEXT_PUBLIC_CHAT_API",
      description: "The backend API for chat endpoint.",
      value: opts.customApiPath
        ? opts.customApiPath
        : "http://localhost:8000/api/chat",
    },
  ];
  const content = renderEnvVar(defaultFrontendEnvs);
  await fs.writeFile(path.join(root, ".env"), content);
};
