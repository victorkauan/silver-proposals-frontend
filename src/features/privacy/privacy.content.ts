export const PRIVACY_CONTACT = 'privacidade@silversoft.com.br'
export const PRIVACY_UPDATED_AT = '22 de novembro de 2026'

type Row = [string, string]

export type PrivacySection = {
  id: string
  title: string
  paragraphs?: string[]
  items?: string[]
  table?: { head: Row; rows: Row[] }
}

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: 'quem-somos',
    title: 'Quem trata seus dados',
    paragraphs: [
      'O Silver Proposals é uma plataforma para criar, editar e compartilhar propostas comerciais com apoio de inteligência artificial. O operador da plataforma é o controlador dos dados da sua conta e dos registros técnicos do serviço.',
      `Para qualquer assunto sobre seus dados, fale com o encarregado pelo e-mail ${PRIVACY_CONTACT}.`,
    ],
  },
  {
    id: 'dados',
    title: 'Quais dados tratamos e por quê',
    table: {
      head: ['Dados', 'Finalidade e base legal (LGPD, art. 7º)'],
      rows: [
        [
          'Nome, e-mail e senha (guardada apenas como hash Argon2id)',
          'Criar sua conta, permitir o login e identificar o autor de cada versão. Execução de contrato.',
        ],
        [
          'Sessões: navegador, data de criação, validade, uso e revogação (o token fica só como hash)',
          'Manter você conectado e detectar o uso de sessões roubadas. Execução de contrato e legítimo interesse em segurança.',
        ],
        [
          'Verificação em duas etapas: chave do autenticador cifrada e códigos de recuperação guardados como hash',
          'Proteger o login contra o uso indevido de uma senha. Legítimo interesse em segurança.',
        ],
        [
          'Registros de acesso: endereço IP, data, hora e informações da requisição',
          'Registrar acessos quando a coleta estiver habilitada. Cumprimento de obrigação legal e segurança do serviço.',
        ],
        [
          'Propostas: título, cliente, briefing, conteúdo e histórico de versões',
          'Prestar o serviço que você contratou. Execução de contrato.',
        ],
        [
          'Briefing e instruções enviados ao modelo de IA',
          'Gerar o rascunho da proposta. Execução de contrato.',
        ],
        [
          'Links de compartilhamento: validade, autor e revogação',
          'Dar ao seu cliente acesso de leitura à proposta. Execução de contrato.',
        ],
        [
          'Registros técnicos: rota, status, duração e identificadores da requisição',
          'Operar, corrigir falhas e proteger o serviço. Legítimo interesse.',
        ],
      ],
    },
    paragraphs: [
      'Os logs da aplicação não registram senhas, tokens, briefings nem o conteúdo das propostas. Os rastreamentos de desempenho não guardam o seu endereço IP. Os registros de acesso do balanceador podem conter o IP e a URL solicitada.',
    ],
  },
  {
    id: 'seus-clientes',
    title: 'Dados dos seus clientes',
    paragraphs: [
      'As propostas podem conter dados pessoais dos seus clientes, como nomes de contato. Para esses dados, a sua empresa é a controladora e o Silver Proposals atua como operador: tratamos os dados apenas para gerar, guardar e compartilhar a proposta, conforme as suas instruções.',
    ],
  },
  {
    id: 'retencao',
    title: 'Por quanto tempo guardamos',
    table: {
      head: ['Dados', 'Prazo'],
      rows: [
        ['Conta', 'Até você excluir a conta.'],
        ['Sessões', 'Até 7 dias; sessões vencidas são apagadas automaticamente.'],
        ['Propostas e versões', 'Até a proposta ou a conta ser excluída.'],
        ['Links de compartilhamento', 'De 1 a 90 dias de validade, à sua escolha.'],
        ['Registros técnicos', '14 dias nos logs e 30 dias nos rastreamentos de desempenho.'],
        ['Registros de acesso', 'Por seis meses quando a coleta estiver habilitada.'],
        ['Verificação em duas etapas', 'Até você desativar a verificação ou excluir a conta.'],
        [
          'Cópias de segurança',
          'Cópias automáticas do banco por 1 dia. Quando a rotina de cópias diárias estiver habilitada, elas são mantidas por 14 dias.',
        ],
      ],
    },
  },
  {
    id: 'compartilhamento',
    title: 'Com quem compartilhamos',
    items: [
      'Amazon Web Services (AWS), que hospeda a aplicação, o banco de dados, os registros técnicos e o modelo de IA (Amazon Bedrock). Os dados enviados ao modelo não são compartilhados com o fornecedor do modelo nem usados para treiná-lo.',
      'Cloudflare, apenas para o serviço de DNS; ela não recebe o tráfego da aplicação.',
      'Não vendemos dados pessoais nem os usamos para publicidade.',
    ],
  },
  {
    id: 'transferencia',
    title: 'Transferência internacional',
    paragraphs: [
      'Os dados são armazenados e processados nos Estados Unidos, na infraestrutura da AWS (região us-east-2, Ohio) e no Amazon Bedrock. Essa transferência internacional está sujeita ao art. 33 da LGPD.',
    ],
  },
  {
    id: 'seguranca',
    title: 'Como protegemos seus dados',
    items: [
      'Criptografia em trânsito (TLS) nas conexões públicas e com o banco de dados. Criptografia em repouso no banco, nos arquivos e nos segredos.',
      'Controle de acesso por proposta (dono, editor e leitor) e links públicos com validade e revogação.',
      'Senhas com Argon2id, verificação em duas etapas opcional, sessões revogáveis e acesso à nuvem sem chaves fixas.',
      'Monitoramento com alertas e uma esteira que verifica a segurança de cada mudança antes de ela chegar ao ar.',
    ],
  },
  {
    id: 'direitos',
    title: 'Seus direitos',
    paragraphs: [
      'Pela LGPD (art. 18), você pode confirmar a existência de tratamento, acessar e corrigir seus dados, pedir a portabilidade, a eliminação e informações sobre compartilhamento, e revogar o consentimento quando ele for a base do tratamento.',
      `Em Minha conta você edita seu perfil, exporta todos os seus dados em um arquivo e exclui sua conta. Para os demais pedidos, escreva para ${PRIVACY_CONTACT}. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).`,
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies e armazenamento no navegador',
    paragraphs: [
      'Usamos apenas um cookie essencial, que mantém sua sessão (inacessível a scripts e enviado só por conexão segura), e guardamos no navegador a sua preferência de tema. Não usamos cookies de publicidade nem de rastreamento.',
    ],
  },
  {
    id: 'alteracoes',
    title: 'Alterações deste aviso',
    paragraphs: [
      'Quando este aviso mudar, vamos pedir que você leia e aceite a nova versão ao entrar na plataforma.',
    ],
  },
]
