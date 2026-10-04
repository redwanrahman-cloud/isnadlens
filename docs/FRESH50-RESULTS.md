# Fresh fifty — Luna/Terra live first pass

Completed 50/50. Label matches 27/50; source-grounded matches 27/50. Wrong decisive labels: 0; unsupported decisive evidence: 0; abstentions: 23.

Language detection matched 50/50. Native languages: English20, Arabic10, Bengali/Hindi/Urdu/Indonesian/Spanish/French3 each, German2. All requests used auto language and auto source selection; reference answers and reviewer glosses were never sent to the app.

The 35yes/15no mix has a70% always-yes baseline. Questions are new propositions/facets against the previous100, including new aspects of some already-used verses. Online category sources establish subject relevance, not a most-searched ranking. References were frozen before calls.

Application commit 6ea7bc7ee93f6bf32f5780f7c56f8a831d3a74ab; primary Luna, bounded Terra escalation, low reasoning. No fixes or external retries during first pass. Existing internal app escalation is part of the tested configuration. The original prior50 result44/50 remains separate; this run cannot isolate the model upgrade from retrieval/prompt/context changes or a different topic/language mix.

Observed run usage USD0.434198 (deduplicated reservations, includes source checking). Conservative total development spending 13.86SAR /18SAR. Prior unknown reservations retained. Judging reserve15SAR preserved by the spending cap.

| Case | Language | Question | Reference | Result | Source review |
| --- | --- | --- | --- | --- | --- |
| N01 | en | Does wudu include wiping the head according to the Quran? | yes | supported_within_selected_corpus | grounded match |
| N02 | ar | هل يذكر القرآن التيمم بصعيد طيب عند عدم وجود الماء وفق الشروط المذكورة؟ | yes | supported_within_selected_corpus | grounded match |
| N03 | en | Can people seek their livelihood after Friday prayer according to the Quran? | yes | supported_within_selected_corpus | grounded match |
| N04 | bn | কোরআন কি বলে যে মুমিনদের নামাজ নির্দিষ্ট সময়ে আদায় করার বিধান রয়েছে? | yes | supported_within_selected_corpus | grounded match |
| N05 | hi | क्या कुरान में पैगंबर को रात में अतिरिक्त नमाज़ पढ़ने का निर्देश दिया गया है? | yes | supported_within_selected_corpus | grounded match |
| N06 | ur | کیا رمضان کی راتوں میں میاں بیوی کا تعلق جائز ہے، بشرطیکہ اعتکاف میں نہ ہوں؟ | yes | insufficient_within_selected_corpus | Missing 2:187; unrelated night worship and itikaf records cannot establish permission. |
| N07 | id | Apakah Al-Qur’an menyebut Safa dan Marwah sebagai bagian dari syiar Allah? | yes | supported_within_selected_corpus | grounded match |
| N08 | es | ¿Dice el Corán que en el sacrificio lo que llega a Allah es la piedad, no la carne ni la sangre? | yes | supported_within_selected_corpus | grounded match |
| N09 | fr | Le Coran demande-t-il de donner leur dot aux femmes? | yes | supported_within_selected_corpus | grounded match |
| N10 | de | Nennt der Koran zwei volle Jahre für das Stillen, wenn die Stillzeit vollendet werden soll? | yes | insufficient_within_selected_corpus | Missing 2:233; search hint dual morphology does not match the primary wording. |
| N11 | en | Does the Quran say a pregnant divorced woman’s waiting period ends when she gives birth? | yes | supported_within_selected_corpus | grounded match |
| N12 | ar | هل ينهى القرآن عن منع المطلقات من العودة إلى أزواجهن بعد انتهاء العدة إذا تراضوا بالمعروف؟ | yes | supported_within_selected_corpus | grounded match |
| N13 | bn | কোরআন কি বলে যে কষ্টের সঙ্গে স্বস্তিও রয়েছে? | yes | supported_within_selected_corpus | grounded match |
| N14 | hi | क्या कुरान कहता है कि अल्लाह किसी व्यक्ति पर उसकी क्षमता से अधिक जिम्मेदारी नहीं डालता? | yes | insufficient_within_selected_corpus | Frozen witness not retrieved; abstention is honest for this packet but fails answer coverage. |
| N15 | ur | کیا قرآن کہتا ہے کہ اللہ کے ذکر سے دلوں کو اطمینان ملتا ہے؟ | yes | supported_within_selected_corpus | grounded match |
| N16 | id | Menurut Al-Qur’an, apakah manusia dijadikan berbangsa dan bersuku agar saling mengenal? | yes | insufficient_within_selected_corpus | Frozen witness not retrieved; abstention is honest for this packet but fails answer coverage. |
| N17 | es | ¿Dice el Corán que Allah toma las almas durante el sueño además de la muerte? | yes | supported_within_selected_corpus | grounded match |
| N18 | fr | Le Coran demande-t-il aux croyants de prier pour le Prophète et de le saluer? | yes | insufficient_within_selected_corpus | Frozen witness not retrieved; abstention is honest for this packet but fails answer coverage. |
| N19 | de | Fordert der Koran dazu auf, beim Besuch der Gebetsstätte angemessenen Schmuck beziehungsweise Kleidung zu tragen? | yes | not_evaluated | 7:31 is present in context, but the positive checker returns uncertain; investigate cross-language/context checking. |
| N20 | en | Does the Quran forbid insulting what other people worship so that they do not insult Allah in ignorance? | yes | insufficient_within_selected_corpus | Frozen witness not retrieved; abstention is honest for this packet but fails answer coverage. |
| N21 | ar | هل ينهى القرآن عن قتل الأولاد خوفا من الفقر؟ | yes | not_evaluated | 17:31 directly supplies the prohibition, but positive checker returns uncertain. |
| N22 | en | Does the Quran describe Allah as near and responding to those who call upon Him? | yes | supported_within_selected_corpus | grounded match |
| N23 | en | Does the Quran describe the heavens and earth as created in six days? | yes | supported_within_selected_corpus | grounded match |
| N24 | en | Does the Quran say jinn and humans were created to worship Allah? | yes | supported_within_selected_corpus | grounded match |
| N25 | ar | هل يصف القرآن الرسول بأنه بشر يوحى إليه؟ | yes | not_evaluated | 18:110 and 41:6 missing; source checker correctly blocks an overclaim from indirect 42:51-52. |
| N26 | en | Does the Quran say Allah needs sleep? | no | conflicting_within_selected_corpus | grounded match |
| N27 | ar | هل يقول القرآن إن النساء لا نصيب لهن في الميراث؟ | no | conflicting_within_selected_corpus | grounded match |
| N28 | en | Does the Quran say people automatically bear guilt for their parents’ sins? | no | insufficient_within_selected_corpus | Quran 6:164 missing as a Quran card despite a retrieved Hadith quoting it; retrieve and authenticate the Quran unit. |
| N29 | en | Does the Quran say a ransom will be accepted on the Day of Judgment? | no | insufficient_within_selected_corpus | Relevant negative ransom verses retrieved; semantic assessment withholds on group/scope flags. Frozen question also needs explicit group/quantifier clarification before a universal verdict is forced. |
| N30 | ar | هل يقول القرآن إن أموال من كفروا وأولادهم تحميهم من عقاب الله؟ | no | conflicting_within_selected_corpus | grounded match |
| N31 | en | Does the Quran say hands and feet will never testify about people’s deeds on Judgment Day? | no | insufficient_within_selected_corpus | 24:24 and 36:65 explicitly contradict never-testify; false qualification flag withholds the verdict. |
| N32 | en | Does the Quran describe Allah as having a child? | no | insufficient_within_selected_corpus | Frozen witness not retrieved; abstention is honest for this packet but fails answer coverage. |
| N33 | bn | কোরআন কি বলে যে সৎকর্মের পুরস্কার শুধু পুরুষদের জন্য, বিশ্বাসী নারীদের জন্য নয়? | no | insufficient_within_selected_corpus | 33:35 is a valid alternative contradiction to women receiving no reward; false qualification flag withholds it. |
| N34 | hi | क्या कुरान कहता है कि शैतान इंसानों का मित्र है और उसे मित्र मानना चाहिए? | no | insufficient_within_selected_corpus | Frozen witness not retrieved; abstention is honest for this packet but fails answer coverage. |
| N35 | ur | کیا قرآن کہتا ہے کہ آسمان، زمین اور ان کے درمیان کی چیزیں بے مقصد پیدا کی گئی ہیں؟ | no | insufficient_within_selected_corpus | Frozen witness not retrieved; abstention is honest for this packet but fails answer coverage. |
| N36 | id | Apakah Al-Qur’an memerintahkan membalas keburukan dengan yang lebih buruk? | no | insufficient_within_selected_corpus | Frozen witness not retrieved; abstention is honest for this packet but fails answer coverage. |
| N37 | es | ¿Dice el Corán que quienes murieron en el camino de Allah no están vivos junto a su Señor? | no | insufficient_within_selected_corpus | 3:169 explicitly contradicts the claim; false qualification flag withholds it. |
| N38 | fr | Pour le pèlerinage tamattu sans offrande disponible, le Coran indique-t-il sept jours de jeûne pendant le Hajj et trois après le retour? | no | insufficient_within_selected_corpus | 2:196 directly states three during Hajj and seven on return; qualification/scope flags incorrectly withhold the reversal verdict. |
| N39 | en | Does the Quran say the sun does not follow any course? | no | conflicting_within_selected_corpus | grounded match |
| N40 | en | Does the Quran instruct asking Allah to decrease one’s knowledge? | no | insufficient_within_selected_corpus | Frozen witness not retrieved; abstention is honest for this packet but fails answer coverage. |
| N41 | en | Does the Hadith teach mentioning Allah’s name, eating with the right hand and taking food from nearby? | yes | supported_within_selected_corpus | grounded match |
| N42 | ar | من أكل أو شرب ناسيا وهو صائم، هل يقول الحديث أن يكمل صومه؟ | yes | insufficient_within_selected_corpus | Frozen witness not retrieved; abstention is honest for this packet but fails answer coverage. |
| N43 | en | Does the Hadith say Allah loves gentleness and rewards it differently from violence? | yes | supported_within_selected_corpus | grounded match |
| N44 | en | Is removing something harmful from a path described as a branch of faith in Hadith? | yes | supported_within_selected_corpus | grounded match |
| N45 | ar | هل يقول الحديث إن الله يرحم من عباده الرحماء؟ | yes | supported_within_selected_corpus | grounded match |
| N46 | en | Does the Hadith describe reward for each letter recited from the Quran, with a good deed multiplied tenfold? | yes | supported_within_selected_corpus | grounded match |
| N47 | en | Does the Hadith encourage prompt iftar rather than needless delay? | yes | insufficient_within_selected_corpus | Frozen witness not retrieved; abstention is honest for this packet but fails answer coverage. |
| N48 | ar | هل أمر النبي في الحديث بأن نصلي كما رأيناه يصلي؟ | yes | insufficient_within_selected_corpus | Frozen witness not retrieved; abstention is honest for this packet but fails answer coverage. |
| N49 | en | Does the Hadith prohibit Muslims shunning one another for more than three nights as a general rule? | yes | supported_within_selected_corpus | grounded match |
| N50 | ar | هل يذكر الحديث رضا الله عن العبد الذي يحمده بعد الأكل أو الشرب؟ | yes | supported_within_selected_corpus | grounded match |

Developer source audit compares complete cited originals, their context, assertion decomposition and returned EN/AR summaries. This is not scholar certification or general accuracy proof. All raw records stay private; public files retain questions, source locators/hashes, verdicts, versions, costs and measured limitations. The second new50 will be selected after this performance is discussed.
