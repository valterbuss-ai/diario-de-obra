-- Identificador gerado no celular para cada registro. Quando o app fica sem
-- internet e reenvia o registro depois, o servidor reconhece o mesmo id e não
-- cria um registro duplicado.
ALTER TABLE "registros" ADD COLUMN "cliente_id" TEXT;

CREATE UNIQUE INDEX "registros_cliente_id_key" ON "registros"("cliente_id");
