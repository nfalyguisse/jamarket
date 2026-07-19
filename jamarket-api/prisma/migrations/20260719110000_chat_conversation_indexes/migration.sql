-- CreateIndex
CREATE UNIQUE INDEX "conversation_ad_id_customer_id_key" ON "conversation"("ad_id", "customer_id");

-- CreateIndex
CREATE INDEX "conversation_admin_id_idx" ON "conversation"("admin_id");

-- CreateIndex
CREATE INDEX "conversation_customer_id_idx" ON "conversation"("customer_id");

-- CreateIndex
CREATE INDEX "message_conversation_id_created_at_idx" ON "message"("conversation_id", "created_at");
