# Contrato das operações

A API utiliza o protocolo Firebase HTTPS Callable na função mutate, região southamerica-east1. O SDK envia automaticamente o ID token da sessão. O servidor extrai o UID do token; nenhum campo de proprietário enviado pelo cliente concede acesso.

Envelope HTTP: POST com Content-Type application/json, Authorization Bearer ID_TOKEN e corpo {"data":{...comando}}. Resposta de sucesso {"result":{"id":"identificador"}}; erros seguem o protocolo callable do Firebase.

| action | Campos além de action |
| --- | --- |
| createConnection | name |
| updateConnection | connectionId, name |
| deleteConnection | connectionId |
| createContact | connectionId, name, phone |
| updateContact | connectionId, contactId, name, phone |
| deleteContact | connectionId, contactId |
| createBroadcast | connectionId, text, contactIds, scheduledAt |
| updateBroadcast | connectionId, broadcastId, text, contactIds, scheduledAt |
| deleteBroadcast | connectionId, broadcastId |

name: 1–100 caracteres após trim. phone: 10–15 dígitos após remoção de espaços e pontuação comum. text: 1–4.000 caracteres após trim. contactIds: 1–100 IDs distintos, existentes e pertencentes ao mesmo usuário e conexão. scheduledAt: null para envio imediato ou inteiro em milissegundos Unix, no futuro e em até 366 dias. IDs aceitam letras, dígitos, _ e -, até 128 caracteres.

Erros esperados: UNAUTHENTICATED sem sessão; INVALID_ARGUMENT para dados inválidos; NOT_FOUND para recurso ausente ou pertencente a outro usuário; RESOURCE_EXHAUSTED ao exceder 100 contatos ou 200 mensagens por conexão. O erro não revela a existência de recursos de outros usuários.

Editar registro enviado altera somente o texto e updatedAt: preserva recipients, scheduledAt e sentAt, sem reenviar. Os IDs originais de destinatários continuam no envelope, mesmo quando os contatos já foram excluídos; o servidor preserva os snapshots históricos e ignora tentativas de substituí-los. Mensagens novas e agendadas exigem contatos atuais da própria conexão. Editar agendamento para scheduledAt null conclui a simulação imediatamente. Excluir contato preserva o snapshot nos registros existentes; excluir conexão remove seus contatos e mensagens atomicamente.

Leituras são realizadas pelo SDK Firestore com filtro obrigatório userId == UID e, para contatos/mensagens, connectionId. Security Rules negam leituras de outros usuários e qualquer escrita direta. O scheduler interno não possui endpoint público de disparo manual.

Os testes reproduzíveis em tests/integration.mjs usam o endpoint callable real do emulador e verificam esses limites de segurança; não dependem de mocks de respostas.
