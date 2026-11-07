import { normalizeTo29Columns } from '../src/services/masterTaxonomyService.js';
import fs from 'fs';

// Mock the questions from screenshot
const q1 = {
  id: "46093623-153c-42ce-9255-4892c7d23c94",
  question_text: "‘நான்மணிக்கடிகை’ என்ற நூலை இயற்றிய ஆசிரியரின் இயற்பெயரைச் சுட்டுக.",
  question_text_tamil: "‘நான்மணிக்கடிகை’ என்ற நூலை இயற்றிய ஆசிரியரின் இயற்பெயரைச் சுட்டுக.",
  option_a: "நாயனார்",
  option_b: "நல்லந்துவனார்",
  option_c: "நாகனார்",
  option_d: "விளம்பி நாகனார்",
  exam_tag: "TNPSC_GROUP_4"
};

const q2 = {
  id: "be40db4f-a8d4-4f36-b1d2-10f1ab975221",
  question_text: "கீழ்க்கண்டவற்றுள் தவறான தொடரைத் தேர்ந்தெடுக்கவும்.",
  option_a: "இந்தியாவில் பேசப்படும் மொழிகளின் எண்ணிக்கை 1300க்கும் மேற்பட்டது.",
  option_b: "பல கிளை மொழிகள் இந்தியாவில் பேசப்படுவதால் இந்நாடு மொழிகளின் காட்சிசாலை என அழைக்கப்படுகிறது.",
  option_c: "திராவிடம் என்ற சொல்லை முதன்முதலில் குறிப்பிட்டவர் ஹீராஸ் பாதிரியார் ஆவார்.",
  option_d: "திராவிட மொழிக்குடும்பம் மொழிகள் பரவிய நில அடிப்படையில் மூன்று வகைகளாகப் பிரிக்கப்பட்டுள்ளது.",
  exam_tag: "TNPSC_GROUP_4"
};

const q3 = {
  id: "5054cf71-6d22-422f-b5ea-92d929fb331c",
  question_text: "கூற்று [A] : உ.வே. சாமிநாதர் அனைவராலும் அன்போடும் உரிமையோடும் தமிழ்த்தாத்தா உ.வே.சா என்று அழைக்கப்படுகிறார்.\nகாரணம் [R] : அழிவு நிலையில் இருந்த வெவ்வேறு சுவடிகளைப் பலமுறை ஒப்பிட்டுப் பார்த்து வாசித்து, நமக்காகத் தாளில் எழுதி அச்சிட்டுப் புத்தகமாக இலக்கியங்களை வழங்கினார்.",
  option_a: "[A] சரி ஆனால் [R] தவறு",
  option_b: "[A] மற்றும் [R] இரண்டும் சரி",
  option_c: "[A] மற்றும் [R] இரண்டும் தவறு",
  option_d: "[A] தவறு ஆனால் [R] சரி",
  exam_tag: "TNPSC_GROUP_4"
};

console.log("=== Q1 Normalization ===");
const norm1 = normalizeTo29Columns(q1, 1);
console.log("en_question_text:", norm1.en_question_text);
console.log("en_option_a:", norm1.en_option_a);
console.log("en_option_b:", norm1.en_option_b);
console.log("ta_question_text:", norm1.ta_question_text);
console.log("ta_option_a:", norm1.ta_option_a);

console.log("\n=== Q2 Normalization ===");
const norm2 = normalizeTo29Columns(q2, 2);
console.log("en_question_text:", norm2.en_question_text);
console.log("en_option_a:", norm2.en_option_a);

console.log("\n=== Q3 Normalization ===");
const norm3 = normalizeTo29Columns(q3, 3);
console.log("en_question_text:", norm3.en_question_text);
console.log("en_option_a:", norm3.en_option_a);
console.log("en_option_b:", norm3.en_option_b);
