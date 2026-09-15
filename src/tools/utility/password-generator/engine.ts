export type PasswordMode = 'random' | 'passphrase' | 'pin';

export interface RandomPasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean; // excludes 0, O, o, 1, l, I
}

export interface PassphraseOptions {
  wordCount: number;
  separator: string;
  capitalize: boolean;
  includeNumber: boolean;
}

export interface PasswordStrength {
  entropyBits: number;
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Moderate' | 'Strong' | 'Unbreakable';
  crackTimeText: string;
  colorClass: string;
}

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS_CHARS = /[0Oo1lI]/g;

// Clean dictionary for memorable Diceware passphrases
const DICTIONARY_WORDS = [
  'apple', 'beach', 'cabin', 'delta', 'eagle', 'frost', 'giant', 'haven',
  'iron', 'jungle', 'koala', 'lemon', 'maple', 'nebula', 'ocean', 'pilot',
  'quest', 'river', 'solar', 'tiger', 'urban', 'vivid', 'winter', 'xenon',
  'yellow', 'zebra', 'anchor', 'breeze', 'cloud', 'dragon', 'ember', 'falcon',
  'glider', 'harbor', 'island', 'jasper', 'knight', 'lagoon', 'meteor', 'native',
  'orbit', 'planet', 'quasar', 'rocket', 'shadow', 'timber', 'unique', 'valley',
  'wizard', 'yacht', 'zenith', 'beacon', 'canyon', 'dune', 'echo', 'forest'
];

// Hardware-level Cryptographically Secure Random Integer
export const getSecureRandomInt = (max: number): number => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % max;
};

// Generate Random Password
export const generateRandomPassword = (opts: RandomPasswordOptions): string => {
  let charPool = '';
  const requiredChars: string[] = [];

  let u = UPPERCASE_CHARS;
  let l = LOWERCASE_CHARS;
  let n = NUMBER_CHARS;
  let s = SYMBOL_CHARS;

  if (opts.excludeAmbiguous) {
    u = u.replace(AMBIGUOUS_CHARS, '');
    l = l.replace(AMBIGUOUS_CHARS, '');
    n = n.replace(AMBIGUOUS_CHARS, '');
  }

  if (opts.uppercase) {
    charPool += u;
    requiredChars.push(u[getSecureRandomInt(u.length)]);
  }
  if (opts.lowercase) {
    charPool += l;
    requiredChars.push(l[getSecureRandomInt(l.length)]);
  }
  if (opts.numbers) {
    charPool += n;
    requiredChars.push(n[getSecureRandomInt(n.length)]);
  }
  if (opts.symbols) {
    charPool += s;
    requiredChars.push(s[getSecureRandomInt(s.length)]);
  }

  if (!charPool) {
    charPool = LOWERCASE_CHARS;
    requiredChars.push(l[getSecureRandomInt(l.length)]);
  }

  const result: string[] = [...requiredChars];
  while (result.length < opts.length) {
    result.push(charPool[getSecureRandomInt(charPool.length)]);
  }

  // Fisher-Yates CSPRNG Shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
};

// Generate Memorable Passphrase
export const generatePassphrase = (opts: PassphraseOptions): string => {
  const selectedWords: string[] = [];
  for (let i = 0; i < opts.wordCount; i++) {
    let word = DICTIONARY_WORDS[getSecureRandomInt(DICTIONARY_WORDS.length)];
    if (opts.capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    selectedWords.push(word);
  }

  let phrase = selectedWords.join(opts.separator);
  if (opts.includeNumber) {
    phrase += `${opts.separator}${getSecureRandomInt(900) + 100}`;
  }
  return phrase;
};

// Generate PIN
export const generatePin = (digits = 6): string => {
  let pin = '';
  for (let i = 0; i < digits; i++) {
    pin += getSecureRandomInt(10).toString();
  }
  return pin;
};

// Calculate Entropy and Time to Crack (assuming modern GPU rig @ 100 Billion guesses/sec)
export const calculateStrength = (password: string): PasswordStrength => {
  if (!password) {
    return {
      entropyBits: 0,
      score: 0,
      label: 'Very Weak',
      crackTimeText: 'Instant',
      colorClass: 'bg-rose-500 text-rose-500',
    };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  if (poolSize === 0) poolSize = 1;

  const entropy = Math.round(password.length * Math.log2(poolSize));

  // Combinations = poolSize ^ length = 2 ^ entropy
  // Rate: 1e11 (100 Billion hashes per sec)
  const seconds = Math.pow(2, entropy) / 1e11;

  let crackTimeText = 'Instant';
  if (seconds < 1) crackTimeText = '< 1 second';
  else if (seconds < 60) crackTimeText = `~${Math.round(seconds)} seconds`;
  else if (seconds < 3600) crackTimeText = `~${Math.round(seconds / 60)} minutes`;
  else if (seconds < 86400) crackTimeText = `~${Math.round(seconds / 3600)} hours`;
  else if (seconds < 31536000) crackTimeText = `~${Math.round(seconds / 86400)} days`;
  else if (seconds < 31536000 * 1000) crackTimeText = `~${Math.round(seconds / 31536000)} years`;
  else if (seconds < 31536000 * 1e6) crackTimeText = `~${Math.round(seconds / (31536000 * 1000))} thousand years`;
  else crackTimeText = `${(seconds / (31536000 * 1e9)).toFixed(1)} billion years`;

  let score = 0;
  let label: PasswordStrength['label'] = 'Very Weak';
  let colorClass = 'bg-rose-500 text-rose-500';

  if (entropy >= 80) {
    score = 4;
    label = 'Unbreakable';
    colorClass = 'bg-emerald-500 text-emerald-500';
  } else if (entropy >= 60) {
    score = 3;
    label = 'Strong';
    colorClass = 'bg-sky-500 text-sky-500';
  } else if (entropy >= 40) {
    score = 2;
    label = 'Moderate';
    colorClass = 'bg-amber-500 text-amber-500';
  } else if (entropy >= 25) {
    score = 1;
    label = 'Weak';
    colorClass = 'bg-orange-500 text-orange-500';
  }

  return { entropyBits: entropy, score, label, crackTimeText, colorClass };
};