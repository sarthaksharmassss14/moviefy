
import { pipeline } from '@xenova/transformers';

// Use the singleton pattern to avoid reloading the model on every request
// taking up memory and CPU.
class EmbeddingPipeline {
    static task = 'feature-extraction';
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance: any = null;

    static async getInstance() {
        if (!this.instance) {
            console.log(`[AI] Loading local embedding model: ${this.model}...`);
            this.instance = await pipeline(this.task as any, this.model, {
                quantized: true, // Use int8 quantization for speed/size
            });
            console.log("[AI] Model loaded successfully.");
        }
        return this.instance;
    }
}

export async function getLocalEmbedding(text: string | string[]) {
    const extractor = await EmbeddingPipeline.getInstance();

    // Ensure input is array
    const inputs = Array.isArray(text) ? text : [text];

    // Run inference
    const output = await extractor(inputs, { pooling: 'mean', normalize: true });

    // Convert Tensor to standard JS array
    // If single input, output.tolist() returns number[][] of size 1
    const embeddings = output.tolist();

    return Array.isArray(text) ? embeddings : embeddings[0];
}
