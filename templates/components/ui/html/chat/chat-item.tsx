// SPDX-FileCopyrightText: 2024 Deutsche Telekom AG, LlamaIndex, Vercel, Inc.
//
// SPDX-License-Identifier: MIT

"use client";

import ChatAvatar from "./chat-avatar";
import { Message } from "./chat-messages";

export default function ChatItem(message: Message) {
  return (
    <div className="flex items-start gap-4 pt-5">
      <ChatAvatar {...message} />
      <p className="break-words whitespace-pre-wrap">{message.content}</p>
    </div>
  );
}
