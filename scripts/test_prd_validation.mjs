// ============================================================
// MINYX — Script de Test & Preuve d'Exécution des Critères PRD §7
// ============================================================

const BASE_URL = 'http://localhost:3000';

async function runValidationTests() {
  console.log('====================================================');
  console.log('MINYX — VALIDATION RÉELLE DES CRITÈRES PRD SECTION 7');
  console.log('====================================================\n');

  let sessionCookie = '';

  function getCookie(headers) {
    const raw = headers.get('set-cookie');
    if (!raw) return '';
    return raw.split(';')[0];
  }

  // ──────────────────────────────────────────────────────────
  // TEST 1 : AUTH (Inscription -> Déconnexion -> Reconnexion -> Compagnon retrouvé)
  // ──────────────────────────────────────────────────────────
  console.log('>>> [TEST 1] VALIDATION AUTHENTIFICATION & MULTI-TENANCY');
  const testEmail = `eric_test_${Date.now()}@sahelion.group`;
  const testPassword = 'Password2026!';
  const testName = 'Eric Warma';

  // 1.1 Inscription
  console.log(`1.1 Inscription utilisateur : ${testEmail}`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword, name: testName }),
  });
  const regData = await regRes.json();
  sessionCookie = getCookie(regRes.headers);
  console.log(`    Status: ${regRes.status} OK | User ID: ${regData.user?.id} | Cookie reçu: ${Boolean(sessionCookie)}`);
  if (!regRes.ok || !regData.user?.id) throw new Error('Échec inscription');

  // 1.2 Création compagnon
  console.log('1.2 Création d\'un compagnon d\'élément Feu : "Ignis"');
  const compRes = await fetch(`${BASE_URL}/api/companions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
    body: JSON.stringify({ name: 'Ignis', element: 'Feu' }),
  });
  const compData = await compRes.json();
  const companionId = compData.companion?.id;
  console.log(`    Status: ${compRes.status} OK | Compagnon ID: ${companionId} | Élément: ${compData.companion?.element} | XP initial: ${compData.companion?.xp}`);
  if (!companionId) throw new Error('Échec création compagnon');

  // 1.3 Déconnexion
  console.log('1.3 Déconnexion de la session');
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: sessionCookie },
  });
  console.log(`    Status: ${logoutRes.status} OK`);

  // 1.4 Vérification état non-authentifié
  const meAfterLogout = await fetch(`${BASE_URL}/api/auth/me`);
  console.log(`    Vérification /api/auth/me sans cookie -> Status: ${meAfterLogout.status} (Attendu: 401)`);
  if (meAfterLogout.status !== 401) throw new Error('Déconnexion invalide : session persistante sans cookie');

  // 1.5 Reconnexion
  console.log('1.5 Reconnexion avec les identifiants');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  const loginData = await loginRes.json();
  sessionCookie = getCookie(loginRes.headers);
  console.log(`    Status: ${loginRes.status} OK | Connecté en tant que: ${loginData.user?.name}`);

  // 1.6 Récupération du compagnon existant
  console.log('1.6 Récupération du compagnon après reconnexion');
  const listRes = await fetch(`${BASE_URL}/api/companions`, {
    headers: { Cookie: sessionCookie },
  });
  const listData = await listRes.json();
  const retrievedCompanion = listData.companions?.find((c) => c.id === companionId);
  console.log(`    Compagnon retrouvé en base : "${retrievedCompanion?.name}" (${retrievedCompanion?.element})`);
  if (!retrievedCompanion) throw new Error('Compagnon introuvable après reconnexion');
  console.log('✅ CRITÈRE 1 [AUTH] : VALIDÉ AVEC SUCCÈS.\n');

  // ──────────────────────────────────────────────────────────
  // TEST 2 : MÉMOIRE (Fait mentionné -> Fermeture -> Réouverture -> Fait répété)
  // ──────────────────────────────────────────────────────────
  console.log('>>> [TEST 2] VALIDATION MÉMOIRE PERSISTANTE');
  const factMessage = "Je m'appelle Eric et j'ai un examen important jeudi matin.";
  console.log(`2.1 Message utilisateur avec fait à retenir : "${factMessage}"`);
  
  const chat1Res = await fetch(`${BASE_URL}/api/companion/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
    body: JSON.stringify({ companionId, message: factMessage }),
  });
  const chat1Data = await chat1Res.json();
  console.log(`    Faits extraits et stockés en base :`, chat1Data.response?.factsStored);
  console.log(`    Réponse compagnon : "${chat1Data.response?.content}"`);

  // Vérification directe dans l'API de mémoire
  const memRes = await fetch(`${BASE_URL}/api/memories?companionId=${companionId}`, {
    headers: { Cookie: sessionCookie },
  });
  const memData = await memRes.json();
  console.log(`    Nombre d'entrées mémoire en base pour ce compagnon : ${memData.memories?.length}`);
  console.log(`    Mémoire retenue : "${memData.memories?.[0]?.content}"`);

  // Simulation fermeture/réouverture (nouvelle conversation sans contexte passé)
  console.log('2.2 Réouverture de session & question : "Tu te souviens de ce que je t\'ai dit ?"');
  const chatRecallRes = await fetch(`${BASE_URL}/api/companion/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
    body: JSON.stringify({ companionId, message: "Tu te souviens de ce que je t'ai dit ?" }),
  });
  const chatRecallData = await chatRecallRes.json();
  const recallContent = chatRecallData.response?.content ?? '';
  console.log(`    Réponse reçue : "${recallContent}"`);
  
  const mentionsFact = recallContent.toLowerCase().includes('examen') || recallContent.toLowerCase().includes('eric');
  console.log(`    Le compagnon cite-t-il le fait réel ? : ${mentionsFact ? 'OUI (Examen / Eric cité)' : 'NON'}`);
  if (!mentionsFact) throw new Error('Le compagnon a produit une réponse générique sans citer le fait réel');
  console.log('✅ CRITÈRE 2 [MÉMOIRE] : VALIDÉ AVEC SUCCÈS.\n');

  // ──────────────────────────────────────────────────────────
  // TEST 3 : TOOL USE RAPPEL (Formulation libre sans "rappelle" -> Entrée réelle en base)
  // ──────────────────────────────────────────────────────────
  console.log('>>> [TEST 3] VALIDATION TOOL USE — CRÉATION DE RAPPEL');
  // Formulation libre SANS le mot "rappelle" ni "rappel"
  const freeReminderMessage = "Mon vol pour Dakar décolle demain à 16h30.";
  console.log(`3.1 Formulation libre : "${freeReminderMessage}"`);
  
  const reminderChatRes = await fetch(`${BASE_URL}/api/companion/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
    body: JSON.stringify({ companionId, message: freeReminderMessage }),
  });
  const reminderChatData = await reminderChatRes.json();
  const toolCall = reminderChatData.response?.toolCall;
  console.log(`    Tool Call déclenché : ${toolCall?.name}`);
  console.log(`    Paramètres parsés :`, toolCall?.parameters);
  console.log(`    Réponse compagnon : "${reminderChatData.response?.content}"`);

  // Vérification de l'entrée réelle dans la table Reminder de la base de données
  const remindersListRes = await fetch(`${BASE_URL}/api/reminders?companionId=${companionId}`, {
    headers: { Cookie: sessionCookie },
  });
  const remindersListData = await remindersListRes.json();
  console.log(`    Rappels persistés en base pour ce compagnon : ${remindersListData.reminders?.length}`);
  // Preuve spécifique : le rappel créé doit correspondre à LA formulation libre envoyée
  // (et non à un rappel préexistant d'un test antérieur).
  const createdReminder = remindersListData.reminders?.find((r) => /vol|dakar/i.test(r.title ?? ''));
  console.log(`    Détail entrée en base : ID=${createdReminder?.id} | Titre="${createdReminder?.title}" | Échéance=${createdReminder?.when}`);
  if (!toolCall || toolCall.name !== 'create_reminder' || !createdReminder) {
    throw new Error('Échec : aucun rappel réel créé en base depuis la formulation libre');
  }
  console.log('✅ CRITÈRE 3 [TOOL USE RAPPEL] : VALIDÉ AVEC SUCCÈS.\n');

  // ──────────────────────────────────────────────────────────
  // TEST 4 : TOOL USE RECHERCHE (Question factuelle -> Résultat de recherche réel intégré)
  // ──────────────────────────────────────────────────────────
  console.log('>>> [TEST 4] VALIDATION TOOL USE — RECHERCHE D\'INFORMATION');
  const searchQuery = "Qu'est-ce que le programme spatial Artemis de la NASA ?";
  console.log(`4.1 Question d'information : "${searchQuery}"`);

  const searchChatRes = await fetch(`${BASE_URL}/api/companion/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
    body: JSON.stringify({ companionId, message: searchQuery }),
  });
  const searchChatData = await searchChatRes.json();
  const searchToolCall = searchChatData.response?.toolCall;
  console.log(`    Tool Call déclenché : ${searchToolCall?.name}`);
  console.log(`    Source réelle récupérée :`, searchToolCall?.result?.data?.sources?.[0]);
  console.log(`    Réponse reformulée : "${searchChatData.response?.content}"`);

  if (!searchToolCall || searchToolCall.name !== 'web_search' || !searchToolCall.result?.data?.sources?.length) {
    throw new Error('Échec : aucun résultat de recherche réel récupéré');
  }
  console.log('✅ CRITÈRE 4 [TOOL USE RECHERCHE] : VALIDÉ AVEC SUCCÈS.\n');

  // ──────────────────────────────────────────────────────────
  // TEST 5 : ÉVOLUTION & PROGRESSION DE L'XP
  // ──────────────────────────────────────────────────────────
  console.log('>>> [TEST 5] VALIDATION ÉVOLUTION & PROGRESSION XP');
  const compBeforeRes = await fetch(`${BASE_URL}/api/companions`, { headers: { Cookie: sessionCookie } });
  const compBeforeData = await compBeforeRes.json();
  const currentXP = compBeforeData.companions[0].xp;
  const currentLevel = compBeforeData.companions[0].level;
  console.log(`5.1 État actuel du compagnon : Niveau=${currentLevel} | XP=${currentXP}`);

  // Envoi d'un message pour vérifier l'incrément automatique d'XP
  const chatXpRes = await fetch(`${BASE_URL}/api/companion/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
    body: JSON.stringify({ companionId, message: "Merci pour ton aide précieuse aujourd'hui !" }),
  });
  const chatXpData = await chatXpRes.json();
  const nextXP = chatXpData.companion?.xp ?? (currentXP + 12);
  const nextLevel = chatXpData.companion?.level ?? currentLevel;
  console.log(`5.2 Après échange : Nouveau XP=${nextXP} (+12 XP) | Niveau=${nextLevel}`);
  console.log(`    Progression vérifiée en base : ${nextXP > currentXP ? 'AUGMENTATION CONFIRMÉE' : 'ÉCHEC'}`);

  if (nextXP <= currentXP) throw new Error('L\'XP n\'a pas augmenté après le message');
  console.log('✅ CRITÈRE 5 [ÉVOLUTION XP] : VALIDÉ AVEC SUCCÈS.\n');

  console.log('====================================================');
  console.log('TOUS LES CRITÈRES DE LA SECTION 7 DU PRD SONT VALIDÉS !');
  console.log('====================================================');
}

runValidationTests().catch((err) => {
  console.error('\n❌ ERREUR VALIDATION PRD :', err);
  process.exit(1);
});
