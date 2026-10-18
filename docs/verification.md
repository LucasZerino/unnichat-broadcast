# Verificação — 17/10/2026

## Ambiente de entrega

- Projeto exclusivo: `unnichat-lucas-20261017`.
- URL: https://unnichat-lucas-20261017.web.app/
- Conta de gerenciamento: `lucasmzerino@gmail.com`.
- Authentication: E-mail/senha ativado e cadastro/login reais verificados.
- Firestore: banco padrão em `nam5`, regras e índices publicados.
- Functions v2: `mutate` e `dispatchScheduled` criadas em `southamerica-east1`, Node.js 22.
- Blaze: confirmado no console após vínculo concluído pelo usuário.
- Hosting: publicação concluída com saída 0.
- Imagens de compilação: política de limpeza após um dia configurada com saída 0. O primeiro comando de Functions terminou com código 1 apenas por ausência dessa política; ambas as funções já tinham sido criadas com sucesso e a configuração pendente foi concluída separadamente.

## Compilação e testes locais

- Compilação completa com a configuração do projeto novo: saída 0; TypeScript estrito e Vite. Pacote principal de aproximadamente 287 kB gzip; aviso de tamanho sem erro de compilação.
- Testes unitários do domínio: 3 passaram, 0 falhas.
- Integração com Auth, Firestore e callable reais dos emuladores: saída 0. Verificados autenticação obrigatória, CRUD, isolamento entre duas contas, escritas diretas negadas, validação, destinatários de outro usuário rejeitados, edição de agendamento, processamento com cliente fechado, concorrência sem duplicação, idempotência e cascata.

## Validação do ambiente publicado

`node tests/production-smoke.mjs --run` terminou com saída 0, usando contas e dados fictícios no projeto acima:

- Cadastro e login por e-mail/senha.
- Servidor utiliza o UID autenticado; campo de proprietário injetado não concede acesso.
- Outra conta não lê nem altera os registros do primeiro usuário e suas consultas não retornam esses dados.
- Regras negam escritas diretas no Firestore.
- Criação/edição de conexão e contato; simulação imediata de mensagem.
- Edição do histórico preserva o instante de envio, sem novo disparo.
- Mensagem agendada foi processada pelo Cloud Scheduler real com os dois clientes encerrados, sem disparo manual do worker.
- Exclusão de mensagens/contato, snapshot preservado e cascata da conexão.
- Contas e documentos criados pelo teste automatizado foram removidos no encerramento.

A primeira sondagem imediatamente após o provisionamento retornou 401. Chamadas subsequentes pela interface, pelo protocolo callable HTTP e por uma nova checagem com o SDK Firebase Functions passaram; não foi necessário alterar a autenticação da aplicação nem suas permissões.

## Navegador no endereço público

- Cadastro, logout, novo login, tratamento de senha incorreta, criação de conexão, contato e envio imediato funcionaram com atualização em tempo real.
- Layout desktop e painel autenticado em 390×844 inspecionados.
- Teste adicional concluído: mensagem agendada pela interface para 17/10 às 21h20, aba fechada antes do vencimento e reaberta após a janela do agendador. Mensagem já estava Enviada; painel exibiu 0 Agendadas e 2 Enviadas, sem disparo manual. Filtro de Agendadas mostrou corretamente a lista vazia.
- Conexão manual e dados vinculados removidos pela interface. Conta fictícia exata da verificação manual removida e ausência confirmada pela API oficial; nenhuma outra conta foi consultada ou alterada. Site deixado na tela inicial para o candidato criar sua própria conta.

## Limites e entrega

Mensagens são exclusivamente simuladas, conforme o enunciado. Até 100 contatos e 200 mensagens por conexão; cada rodada do agendador processa até 200 mensagens. O horário é armazenado em UTC e apresentado no fuso local.

Código mantido localmente para avaliação interna. Aplicação publicada e validada, pronta para revisão do candidato e entrega até 18/10/2026 às 18h (Brasil). Formulário de entrega não enviado.

## Revisão de estrutura antes da entrega

Revisão e reorganização concluídas em 17/10, mantendo a stack e as regras do enunciado.

- `web/src/App.tsx`: 1.246 → 16 linhas. Agora apenas coordena a sessão e a tela exibida.
- Componentes agrupados em autenticação, conexões, contatos e mensagens. Layout e confirmações compartilhados em `components`; sessão/assinaturas em `hooks`; datas/erros em `lib`; tema separado do bootstrap.
- Maior componente TSX: `ConnectionView.tsx`, 244 linhas; `MessageDialog.tsx`, 218. O CSS global tem 257 linhas e mantém layout/responsividade compartilhados.
- `functions/src/index.ts`: 252 → 44 linhas. Registro/autenticação/validação separados da coordenação de mutações, operações de mensagens e scheduler. Maior módulo do backend: 121 linhas.
- Removido `web/src/data.ts` antigo após migração dos consumidores. Imports de ícones agora são diretos; o build transformou 971 módulos (antes 11.714), terminando em aproximadamente 9 segundos nesta máquina.
- Nenhuma dependência nova adicionada. Sem classes próprias, subcoleções, camadas de repositório ou abstrações para uso futuro.
- Corrigidos o build obrigatório antes da integração, instruções do alvo de deploy e agendamento curto que tornava o teste de exclusão sujeito à velocidade da máquina.

Defeitos funcionais encontrados e corrigidos:

1. Histórico enviado pode ter o texto corrigido após excluir todos os seus contatos originais; destinatários, status e horários ficam imutáveis. A integração verifica IDs excluídos, substitutos, estrangeiros e inexistentes e ausência de reenvio.
2. Em mensagem nova/agendada, excluir um contato por outra aba remove seu ID da seleção efetiva, contador e payload. O navegador confirmou contador zerado, botão desabilitado e posterior envio válido ao contato restante.

Validação da versão revisada:

- TypeScript estrito e checagem adicional de imports/parâmetros não usados: saída 0.
- Testes de domínio (3) e integração completa com regressões novas: saída 0.
- Build da interface: saída 0. Publicação conjunta de Firestore, Functions e Hosting: saída 0.
- Smoke real após a publicação: saída 0, incluindo agendador sem clientes abertos e edição após exclusão com snapshots/timestamps preservados.
- Navegador: versão publicada confirmada, criação/envio, remoção concorrente em duas abas, edição histórica e layout desktop/celular verificados.
- Fixtures automatizadas e manuais removidas, incluindo as contas fictícias. Formulário de entrega continua sem envio.

Limites desta revisão: a interface foi conferida no navegador, sem introduzir uma suíte automatizada de componentes. Não foi realizado teste de carga nem esgotamento das cotas de 100/200 registros; limites e concorrência foram revisados no código e os fluxos transacionais principais cobertos pela integração.
