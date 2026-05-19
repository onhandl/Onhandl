/**
 * Builds a standardized system prompt based on a character profile.
 * 
 * @param character - The character profile
 * @returns A formatted string containing names, bios, and instructions
 */
export function buildSystemPrompt(character: any): string {
    let prompt = `Name: ${character.name}\n`;
    if (character.bio) prompt += `Bio: ${character.bio}\n`;

    if (character.instructions && character.instructions.length > 0) {
        prompt += `\nInstructions:\n${character.instructions.map((i: string) => `- ${i}`).join('\n')}\n`;
    }

    if (character.traits) {
        if (character.traits.personality) {
            prompt += `\nPersonality:\n${character.traits.personality.join(', ')}\n`;
        }
        if (character.traits.knowledge) {
            prompt += `\nKnowledge Areas:\n${character.traits.knowledge.join(', ')}\n`;
        }
    }

    return prompt;
}
