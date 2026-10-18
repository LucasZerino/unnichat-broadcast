# Broadcast — teste prático UnniChat

Aplicação de broadcast simulado feita com React, TypeScript, Vite, Material UI, Tailwind CSS e Firebase. Não envia SMS, WhatsApp ou qualquer mensagem real.

## Organização

| Área | Responsabilidade |
| --- | --- |
| `web/src/App.tsx` | Decide entre login e área autenticada. |
| `web/src/features/auth` | Cadastro e entrada. |
| `web/src/features/connections` | Navegação, contexto da conexão e composição dos painéis. |
| `web/src/features/contacts` | Busca, listagem e formulário de contatos. |
| `web/src/features/messages` | Listagem/filtros, cartões, seleção de destinatários e formulário de mensagem. |
| `web/src/components` | Marca, estados vazios, cabeçalho e confirmação de exclusão compartilhados. |
| `web/src/hooks` | Sessão e assinaturas do Firestore, com cleanup. |
| `web/src/lib` | Datas e apresentação de erros. |
| `web/src/firebase.ts`, `types.ts`, `theme.ts` | Integração Firebase, modelo de dados e tema visual. |
| `functions/src/index.ts` | Registro das funções, autenticação e validação de entrada. |
| `functions/src/domain.ts` | Schema e regras puras de validação. |
| `functions/src/mutations.ts` | Conexões, contatos e coordenação transacional. |
| `functions/src/broadcasts.ts` | Mutações de mensagens e preservação do histórico. |
| `functions/src/scheduler.ts` | Processamento idempotente dos agendamentos. |
| `tests`, `docs`, `scripts` | Integração/validação real, contrato e ferramentas locais de operação. |

Os componentes de lista recebem dados e callbacks; os formulários mantêm o próprio estado. Assinaturas e sessão ficam nos hooks; segurança e regras de persistência são impostas no backend. A estrutura usa funções, sem classes próprias ou subcoleções.

## Executar localmente
Requisitos: Node.js 22, npm e Java 21.
1. `npm ci` (ou `npm install` na primeira instalação).
2. `npm run build`.
3. `npm run emulators`.
4. Em outro terminal, `npm run dev`.
5. Abra o endereço exibido pelo Vite e crie uma conta de teste.
Sem variáveis locais, o modo de desenvolvimento usa automaticamente o projeto seguro `demo-unnichat` e emuladores em localhost. A interface dos emuladores fica em http://127.0.0.1:4000.
O agendador do Cloud Scheduler não é executado automaticamente pelo emulador. Para simular o worker local sem navegador, use `node scripts/local-worker.cjs` em um terceiro terminal após o build.

## Verificações
- `npm test`: validação de comandos, horários e elegibilidade de mensagens.
- `npm run test:integration`: inicia os emuladores e verifica autenticação, CRUD, isolamento entre duas contas, bloqueio de acesso direto, agendamento com cliente encerrado, concorrência, idempotência e exclusão em cascata.
- `npm run build`: TypeScript estrito e pacote de produção.
Use dados fictícios na avaliação.

## Modelo de dados
Todas as coleções são planas; não existem subcoleções.
- `connections/{id}`: userId, name, contactCount, broadcastCount, createdAt, updatedAt.
- `contacts/{id}`: userId, connectionId, name, phone, createdAt, updatedAt.
- `broadcasts/{id}`: userId, connectionId, text, recipients [{id,name,phone}], status, scheduledAt, sentAt, createdAt, updatedAt.
O UID do Firebase Authentication representa o cliente (tenant). Não é aceito um identificador de proprietário enviado pelo frontend.

## Segurança e concorrência
As Security Rules permitem apenas leituras de documentos pertencentes ao UID autenticado. Consultas incluem filtro por userId. Todas as escritas diretas são negadas. A Cloud Function callable `mutate` autentica o usuário, valida dados com Zod e verifica proprietário e vínculo com a conexão em cada operação.
Alterações de contatos e mensagens também atualizam a conexão dentro de transações, serializando com a exclusão da conexão. Excluir uma conexão remove contatos e mensagens atomicamente.
São permitidos até 100 contatos e 200 mensagens por conexão, mantendo a exclusão abaixo do limite de 500 escritas de uma transação. O limite é validado no servidor; remova registros antigos para liberar espaço.
Destinatários são armazenados como snapshot para manter o histórico mesmo após edição/exclusão do contato. Editar uma mensagem já enviada corrige apenas o texto e mantém os destinatários e horários originais, mesmo após excluir os contatos, sem novo disparo. Mensagens agendadas podem ser alteradas, antecipadas para envio imediato ou excluídas; sua seleção considera apenas contatos que ainda existem.

## Agendamento
`dispatchScheduled` usa Cloud Functions v2 e Cloud Scheduler, com execução a cada minuto em UTC. Horários escolhidos no navegador são convertidos para instantes UTC.
O worker consulta mensagens vencidas e revalida status, horário e existência/proprietário da conexão em uma transação antes de marcar como enviada. Execuções repetidas ou concorrentes não reenviam a mesma mensagem.
A simulação marca status como enviada; não há integração externa a executar. Uma rodada trata até 200 mensagens. Caso haja mais, as próximas rodadas esvaziam a fila. A latência esperada é de até um minuto, além de eventual atraso do serviço.

## Publicar
1. Crie um projeto Firebase exclusivo; habilite Authentication com e-mail/senha e crie um Firestore (modo produção).
2. Cloud Functions e Cloud Scheduler exigem projeto com faturamento compatível (Blaze). Não exponha credenciais de serviço no frontend.
3. Registre um app Web no console.
4. Copie `web/.env.example` para `web/.env.production.local`, preencha a configuração pública do app e defina `VITE_USE_EMULATORS=false`.
5. Autentique a CLI na conta com acesso ao projeto do teste. Nesta entrega, `.firebaserc` e `npm run deploy` apontam explicitamente para `unnichat-lucas-20261017`, e o comando de deploy usa a conta `lucasmzerino@gmail.com`. Para reproduzir em outro projeto, altere esses alvos e a configuração Web juntos; apenas `firebase use --add` não substitui os argumentos fixos do script.
6. `npm run deploy`.
7. Confirme o provedor de e-mail/senha habilitado e os domínios do Hosting autorizados em Authentication.
8. Aguarde a criação dos índices, crie duas contas e execute o roteiro abaixo no endereço público.
As chaves de configuração Web identificam o projeto e não substituem as Security Rules. Nunca inclua arquivos de conta de serviço ou tokens no repositório.

## Roteiro de aceitação
- Cadastrar e entrar; encerrar sessão e entrar novamente.
- Criar, renomear e excluir conexão.
- Criar, buscar, editar e excluir contato.
- Selecionar um ou vários contatos e enviar mensagem imediata simulada.
- Agendar mensagem, fechar a aplicação, aguardar a rodada do servidor e reabrir: status Enviada.
- Filtrar enviadas/agendadas; editar e excluir mensagens.
- Entrar com outra conta e confirmar que os dados da primeira não aparecem.
- Excluir uma conexão com dados e confirmar que seus contatos e mensagens foram removidos.
- Verificar tela pequena, campos obrigatórios, erros de rede e senha incorreta.

## Entrega
Prazo comunicado: 18/10/2026 às 18h (Brasil).
A página de instruções pede nome completo e URL funcional no formulário ao final:
https://unnichat.notion.site/Tec-UC-Desenvolvedor-Full-Stack-0926-3d01b3f4dcd38071910df715fe1e051b
O projeto está destinado exclusivamente à avaliação interna. Não há publicação de código em repositório público.

## Referências
- https://firebase.google.com/docs/functions/schedule-functions
- https://firebase.google.com/docs/firestore/security/test-rules-emulator
- https://mui.com/material-ui/integrations/tailwindcss/tailwindcss-v4/

## Estado atual da entrega
Projeto atual: `unnichat-lucas-20261017`, conta `lucasmzerino@gmail.com`. Este é o único destino do comando de publicação. Os projetos anteriores não são usados pela configuração atual.

URL publicada: https://unnichat-lucas-20261017.web.app/

Authentication com e-mail/senha ativado. Firestore, regras, índices, Hosting e as funções `mutate`/`dispatchScheduled` publicados. Blaze confirmado no projeto correto após o vínculo financeiro concluído pelo usuário. Imagens antigas de compilação têm limpeza automática após um dia.

O teste `node tests/production-smoke.mjs --run` exige a configuração pública local `.firebase-web-config.json` e testa o ambiente real com contas fictícias, removidas ao final. Saída 0: cadastro/login, autenticação, isolamento entre contas, bloqueio de escritas diretas, CRUD, histórico, agendamento executado pelo Cloud Scheduler sem clientes abertos e exclusão em cascata. O arquivo `docs/verification.md` registra a evidência e a conferência manual no navegador.

Para avaliar, abra o endereço público e crie sua própria conta com e-mail/senha. O formulário de entrega permanece sem envio para revisão do candidato. Blaze é pagamento conforme uso; as cotas gratuitas não garantem ausência de cobrança.
