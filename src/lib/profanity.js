const leetMap = {
  "0": "o", "1": "i", "2": "z", "3": "e", "4": "a", "5": "s", "6": "g",
  "7": "t", "8": "b", "9": "g",
  "@": "a", "$": "s", "!": "i", "%": "x", "#": "h",
  "(": "c", ")": "c", "<": "c", ">": "c",
  "*": "a", "+": "t", "=": "e",
}

const homoglyphMap = {
  "à": "a", "á": "a", "â": "a", "ã": "a", "ä": "a", "å": "a", "æ": "a",
  "è": "e", "é": "e", "ê": "e", "ë": "e",
  "ì": "i", "í": "i", "î": "i", "ï": "i",
  "ò": "o", "ó": "o", "ô": "o", "õ": "o", "ö": "o", "ø": "o",
  "ù": "u", "ú": "u", "û": "u", "ü": "u",
  "ý": "y", "ÿ": "y",
  "ñ": "n", "ç": "c",
  "ß": "ss",
}

const words = {
  profanity: [
    "fuck", "shit", "cunt", "bitch", "asshole", "dick", "bastard",
    "motherfucker", "pissed", "cock", "prick", "douche", "twat",
    "wanker", "bollocks", "arsehole", "shithead", "dickhead",
  ],
  slurs: [
    "nigger", "nigga", "faggot", "fag", "kike", "spic", "chink",
    "gook", "wetback", "raghead", "coon", "dyke", "tranny",
    "retard", "mongoloid",
  ],
  sexual: [
    "porn", "blowjob", "handjob", "fellatio", "cunnilingus",
    "penis", "vagina", "clit", "dildo", "vibrator",
    "orgasm", "cum", "semen", "masturbate", "masturbation",
    "prostitute", "whore", "slut", "hooker", "escort",
    "incest", "bestiality", "molest", "pedophile", "pedo",
    "rape", "rapist",
  ],
  drugs: [
    "weed", "cocaine", "crack", "heroin", "meth", "amphetamine",
    "ecstasy", "mdma", "lsd", "mushroom", "shroom",
    "opium", "morphine", "oxycodone", "xanax", "adderall",
    "marijuana", "cannabis", "hash", "inject",
  ],
  insults: [
    "idiot", "imbecile", "moron",
  ],
  violence: [
    "kill", "murder",     "suicide", "selfharm",
    "slaughter", "massacre", "torture", "beheading",
    "terrorist", "terrorism", "bomb", "explosive",
  ],
  harassment: [
    "kys", "kill yourself",
    "die", "worthless",
    "pathetic", "loser", "nobody",
    "bully", "bullying",
  ],
}

const allowedMild = ["damn", "hell", "crap", "ass"]

const allWords = Object.values(words).flat()
const multiWordPhrases = allWords.filter(w => w.includes(" "))
const singleWords = allWords.filter(w => !w.includes(" "))

const normalizeText = (text) => {
  let s = text.toLowerCase()
  for (const [leet, letter] of Object.entries(leetMap)) {
    s = s.split(leet).join(letter)
  }
  for (const [glyph, letter] of Object.entries(homoglyphMap)) {
    s = s.split(glyph).join(letter)
  }
  s = s.replace(/[^a-z\s]/g, "")
  s = s.replace(/(.)\1+/g, "$1")
  return s
}

export function censorMessage(text) {
  const separatorsRegex = /[.\-*_@+~:;,#$%^&!=|\\/()[\]]/g

  const normalizedFull = normalizeText(text.replace(separatorsRegex, ""))
  for (const phrase of multiWordPhrases) {
    if (normalizedFull.includes(phrase)) {
      return "*".repeat(text.length)
    }
  }

  const tokens = text.split(/(\s+)/)

  return tokens.map((token) => {
    if (!token.trim()) return token

    const stripped = token.replace(separatorsRegex, "")
    if (!stripped) return token

    const normal = normalizeText(stripped)
    if (!normal) return token

    for (const badWord of singleWords) {
      if (normal.includes(badWord)) {
        return "*".repeat(token.length)
      }
    }

    return token
  }).join("")
}
