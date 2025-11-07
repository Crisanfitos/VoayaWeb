import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set");
}

class GeminiService {
    private ai: GoogleGenAI;
    private chatModels: Record<string, Chat>;
    private defaultChatModel: Chat;

    constructor() {
        this.ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
        this.initializeChatModels();
    }

    private initializeChatModels() {
        // Inicializar modelos de chat para diferentes categorías
        this.chatModels = {
            flights: this.createChatModel(['flights']),
            hotels: this.createChatModel(['hotels']),
            experiences: this.createChatModel(['experiences']),
            'flights-hotels': this.createChatModel(['flights', 'hotels']),
            'flights-experiences': this.createChatModel(['flights', 'experiences']),
            'hotels-experiences': this.createChatModel(['hotels', 'experiences']),
            'flights-hotels-experiences': this.createChatModel(['flights', 'hotels', 'experiences']),
        };

        this.defaultChatModel = this.ai.chat({
            model: 'gemini-2.5-pro',
            generationConfig: {
                temperature: 0.9,
            },
        });
    }

    private createChatModel(categories: string[]): Chat {
        const categorySet = new Set(categories);
        let specializedInstructions = this.getBaseInstructions();

        // Agregar instrucciones específicas según las categorías seleccionadas
        if (categorySet.has('flights')) {
            specializedInstructions += this.categoryInstructions.flights;
        }
        if (categorySet.has('hotels')) {
            specializedInstructions += this.categoryInstructions.hotels;
        }
        if (categorySet.has('experiences')) {
            specializedInstructions += this.categoryInstructions.experiences;
        }

        return this.ai.chat({
            model: 'gemini-2.5-pro',
            generationConfig: {
                temperature: 0.9,
            },
            safetySettings: [
                {
                    category: 'HARM_CATEGORY_HARASSMENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                },
                {
                    category: 'HARM_CATEGORY_HATE_SPEECH',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                },
                {
                    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                },
                {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                },
            ],
        });
    }

    public getChatModelForCategories(categories?: string[]): Chat {
        if (!categories || categories.length === 0) {
            return this.defaultChatModel;
        }

        // Ordenar las categorías para mantener consistencia en las claves
        const key = categories.sort().join('-');
        return this.chatModels[key] || this.defaultChatModel;
    }

    private getBaseInstructions(): string {
        return `# ROL Y OBJETIVO
Eres **"VOAYA"**, un asistente de viaje virtual experto, amable y eficiente.`;
    }

    private categoryInstructions = {
        flights: `... // Instrucciones específicas para vuelos`,
        hotels: `... // Instrucciones específicas para hoteles`,
        experiences: `... // Instrucciones específicas para experiencias`
    };

    public async generatePlan(brief: any, userLocation: any): Promise<any> {
        const planGenerationModel = this.ai.getGenerativeModel({
            model: 'gemini-2.5-pro',
            generationConfig: {
                temperature: 0.7,
            },
            safetySettings: [
                {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                },
            ],
        });

        // ... resto de la lógica de generatePlan
    }
}

export const geminiService = new GeminiService();