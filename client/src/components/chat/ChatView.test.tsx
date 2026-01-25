import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ChatView from './chat-view';
import { ApiService } from '@/services/api';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock cookies
vi.mock('@/lib/cookies', () => ({
    getUserIdFromCookie: vi.fn(() => 'user-123'),
    getChatIdFromCookie: vi.fn(() => 'chat-123'),
}));

// Mock API Service
vi.mock('@/services/api', () => ({
    ApiService: {
        sendMessageStream: vi.fn(),
        completeChat: vi.fn(),
    }
}));

// Helper to create a mock stream
function createMockStream(chunks: string[]) {
    const encoder = new TextEncoder();
    let index = 0;

    return {
        read: vi.fn().mockImplementation(async () => {
            if (index >= chunks.length) {
                return { done: true, value: undefined };
            }
            const chunk = chunks[index++];
            return { done: false, value: encoder.encode(chunk) };
        })
    };
}

describe('ChatView Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock scrollIntoView
        Element.prototype.scrollIntoView = vi.fn();
    });

    it('should render initial UI', () => {
        render(<ChatView onChatComplete={vi.fn()} error={null} />);
        expect(screen.getByText('¡Hola! Soy tu asistente de viajes')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should stream AI response', async () => {
        const mockStreamReader = createMockStream(['H', 'ola', ' Mundo']);
        (ApiService.sendMessageStream as any).mockResolvedValue(mockStreamReader);

        render(<ChatView onChatComplete={vi.fn()} error={null} />);

        const input = screen.getByRole('textbox');
        const sendButton = screen.getByRole('button', { name: /send/i });

        fireEvent.change(input, { target: { value: 'Hola' } });
        fireEvent.click(sendButton);

        // Expect user message
        expect(screen.getByText('Hola')).toBeInTheDocument();

        // Wait for streaming to update
        // We expect "H", then "Hola", then "Hola Mundo"
        // Due to react state updates and testing library, we can check for final state or use findBy

        // Eventually we should see the full text
        await waitFor(() => {
            expect(screen.getByText('Hola Mundo')).toBeInTheDocument();
        });

        expect(ApiService.sendMessageStream).toHaveBeenCalledWith('chat-123', 'Hola', 'user-123');
    });

    it('should handle API validation error gracefully', async () => {
        (ApiService.sendMessageStream as any).mockRejectedValue(new Error('API Error'));

        render(<ChatView onChatComplete={vi.fn()} error={null} />);

        const input = screen.getByRole('textbox');
        const sendButton = screen.getByRole('button', { name: /send/i });

        fireEvent.change(input, { target: { value: 'Error Test' } });
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(screen.getByText(/problemas para conectarme/i)).toBeInTheDocument();
        });
    });
});
