import { google } from '@ai-sdk/google';
import { UIMessage, convertToModelMessages, Experimental_Agent as Agent, stepCountIs } from 'ai';
import { prisma } from '@/lib/prisma';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const agent = new Agent({
    model: google('gemini-2.5-flash'),
    tools: {
        // Add your tools here
    },
    stopWhen: stepCountIs(20),
});

export async function POST(req: Request) {
    const { messages, chatId }: { messages: UIMessage[]; chatId?: string } = await req.json();

    // Get or create chat
    let chat;
    if (chatId) {
        chat = await prisma.chat.findUnique({ where: { id: chatId } });
    }
    if (!chat) {
        chat = await prisma.chat.create({ data: {} });
    }

    // Save the user's message (last message in the array)
    const userMessage = messages[messages.length - 1];
    const content = convertToModelMessages(messages)[0].content[0] as { text: string }
    await prisma.message.create({
        data: {
            role: userMessage.role,
            text: content.text,
            chatId: chat.id,
        },
    });

    const result = agent.stream({
        messages: convertToModelMessages(messages),
    });

    await prisma.message.create({
        data: {
            role: 'assistant',
            text: await result.text,
            chatId: chat.id,
        },
    });

    return result.toUIMessageStreamResponse()
}