-- Exclusão lógica de cadastros mestres: cadastros já usados em registros não
-- podem ser apagados de verdade (quebraria o histórico), então ficam marcados
-- como excluídos e somem das listas.
ALTER TABLE "motoristas" ADD COLUMN "excluido_em" TIMESTAMP(3);
ALTER TABLE "placas" ADD COLUMN "excluido_em" TIMESTAMP(3);
ALTER TABLE "contratos" ADD COLUMN "excluido_em" TIMESTAMP(3);
ALTER TABLE "servicos" ADD COLUMN "excluido_em" TIMESTAMP(3);
ALTER TABLE "usinas" ADD COLUMN "excluido_em" TIMESTAMP(3);
ALTER TABLE "rodovias" ADD COLUMN "excluido_em" TIMESTAMP(3);
ALTER TABLE "climas" ADD COLUMN "excluido_em" TIMESTAMP(3);
