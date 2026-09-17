-- A foto do ticket passa a ser arquivada no SharePoint, junto das outras fotos do
-- registro (tabela registro_fotos), numa árvore separada "Tickets/...".
ALTER TYPE "TipoFoto" ADD VALUE 'ticket';

-- Coluna do caminho local antigo: não é mais usada (as fotos não ficam no disco).
ALTER TABLE "registros" DROP COLUMN "foto_ticket";
