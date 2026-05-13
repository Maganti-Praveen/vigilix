/**
 * Room Code Generator
 * Generates short, unique, human-readable room codes
 */

const CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous: 0, O, 1, I
const CODE_LENGTH = 6;

/**
 * Generate a random room code
 * @returns {string} A 6-character alphanumeric room code
 */
function generateRoomCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
  }
  return code;
}

/**
 * Generate a unique room code that doesn't exist in the rooms map
 * @param {Map} rooms - The current rooms map
 * @returns {string} A unique room code
 */
function generateUniqueRoomCode(rooms) {
  let code;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    code = generateRoomCode();
    attempts++;
    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique room code');
    }
  } while (rooms.has(code));

  return code;
}

module.exports = { generateRoomCode, generateUniqueRoomCode };
