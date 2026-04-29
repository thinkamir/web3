# Draw Service / Merkle Tree / Contract Adapter / Indexer 设计说明

## 1. 模块目标

本文定义 AlphaQuest MVP 中「链上公平奖励池」最小可行实现的 4 个后端模块：

1. Draw Service（开奖服务）
2. Merkle Tree Service（默克尔树服务）
3. Contract Adapter（合约适配层）
4. Indexer（链上事件索引器）

并补充 E2E 测试策略，确保从用户参与到上链开奖、中奖认领的核心链路可验证。

---

## 2. 领域模型（MVP）

- `draw_rounds`
  - `id`, `campaign_id`, `status(draft|open|sealed|drawn|claimable|closed|cancelled)`
  - `chain_id`, `contract_address`
  - `total_tickets`, `final_merkle_root`, `random_number`, `winning_ticket`
  - `open_at`, `seal_at`, `draw_tx_hash`, `settled_at`
- `draw_entries`
  - `id`, `draw_round_id`, `user_id`, `wallet`, `ticket_start`, `ticket_end`, `points_cost`
  - `source_tx_id`(积分锁定流水关联)
- `draw_winners`
  - `draw_round_id`, `user_id`, `wallet`, `ticket_no`, `proof_json`, `claimed_at`, `claim_tx_hash`
- `point_transactions`
  - 任何参与奖池/退回/冲正都必须记录交易流水。

> 约束：任何积分变更必须通过 `point_transactions` 体现，不可直接改余额。

---

## 3. Draw Service 设计

### 3.1 责任

- 管理开奖轮次状态机。
- 在封盘时触发 Merkle 构建。
- 调用 Contract Adapter 提交 `finalMerkleRoot`。
- 监听/轮询 Indexer 返回随机数事件。
- 计算 `winningTicket = randomNumber % totalTickets + 1`。
- 产出 winner 与 claim 所需 proof。

### 3.2 状态机

`draft -> open -> sealed -> drawn -> claimable -> closed`

异常路径：
- `open -> cancelled`（活动取消，积分回滚）
- `sealed -> cancelled`（上链失败超时）

### 3.3 核心接口（建议）

- `POST /internal/draw-rounds/:id/open`
- `POST /internal/draw-rounds/:id/seal`
- `POST /internal/draw-rounds/:id/request-draw`
- `POST /internal/draw-rounds/:id/finalize`
- `POST /internal/draw-rounds/:id/close`

### 3.4 幂等与一致性

- 所有状态变迁 API 必须携带 `idempotency_key`。
- 使用 DB 事务 + `FOR UPDATE` 锁定 `draw_rounds` 行。
- 外部链上写入使用 outbox pattern（`pending_chain_actions`）避免“库成功链失败”。

---

## 4. Merkle Tree Service 设计

### 4.1 输入输出

输入：该轮有效 ticket 区间列表（按 `ticket_start` 升序）。
叶子建议结构：

`leaf = keccak256(abi.encode(drawRoundId, wallet, ticketStart, ticketEnd))`

输出：
- `root`
- 每个叶子的 `proof[]`
- 构建快照（hash + version）用于审计复算

### 4.2 关键原则

- 固定排序：按 `ticket_start`，并二次按 `wallet` 字典序。
- 固定编码：必须与合约一致（`abi.encode` vs `abi.encodePacked` 明确固定）。
- 可复算：保存 `merkle_snapshot.json` 到对象存储（S3/MinIO）。

### 4.3 防错

- 构建前校验 ticket 区间无重叠且连续。
- `totalTickets` 必须等于最后一条 `ticket_end`。
- 若数据不一致，封盘失败并报警。

---

## 5. Contract Adapter 设计

### 5.1 职责边界

Contract Adapter 负责**唯一**链交互出口：

- `setFinalRoot(roundId, root, totalTickets)`
- `requestRandom(roundId)`
- `claim(roundId, wallet, ticketNo, proof)`
- 读取合约状态 `getRound(roundId)`

### 5.2 最佳实践

- 对写操作统一重试策略（指数退避 + nonce 冲突处理）。
- 每个 tx 持久化：`request_payload`, `tx_hash`, `chain_id`, `block_number`, `receipt_status`。
- 失败分级：可重试（网络、gas）与不可重试（revert 业务错误）。

### 5.3 安全

- 热钱包权限最小化，建议仅持有开奖合约操作角色。
- 私钥来自密钥管理系统（KMS/Vault），禁止硬编码。
- 所有方法接入前做参数白名单校验（chainId, contractAddress）。

---

## 6. Indexer 设计

### 6.1 事件范围

- `RoundRootSet(roundId, root, totalTickets)`
- `RandomRequested(roundId, requestId)`
- `RandomFulfilled(roundId, randomNumber)`
- `PrizeClaimed(roundId, winner, amount)`

### 6.2 架构建议

- 按链分区 worker：`indexer:{chainId}`。
- 维护 `sync_cursor`（`from_block`, `to_block`, `last_finalized_block`）。
- 确认数策略（如 12 blocks）处理 reorg。

### 6.3 对外产物

- `chain_events` 明细表（可审计）。
- 领域投影：更新 `draw_rounds.random_number`、`draw_winners.claimed_at`。
- 触发内部事件：`draw.random.fulfilled`、`draw.prize.claimed`。

---

## 7. E2E 测试矩阵

## 7.1 必测主流程

1. 用户 A/B/C 参与同一 draw round，生成连续 ticket。
2. seal 时构建 root 并上链设置成功。
3. 请求随机数并接收 fulfill 事件。
4. 后端计算 winning ticket，定位赢家并生成 proof。
5. 赢家 claim 成功，非赢家 claim 失败。

## 7.2 异常流程

- 重复 seal（幂等验证）
- root 已上链但 DB 写失败（恢复任务补偿）
- indexer 遇到链重组（回滚后重放）
- claim 重放攻击（同 proof 再次提交失败）
- 活动取消时积分退回流水完整

## 7.3 断言清单

- `point_transactions` 与 `draw_entries` 金额一致。
- `winningTicket` 公式严格满足：`random % total + 1`。
- Merkle proof 本地验证与合约验证一致。
- 全链路日志可追踪：`request_id / round_id / tx_hash`。

---

## 8. 里程碑拆分（建议 2 Sprint）

### Sprint 1

- Draw Round 状态机 + entries + points lock
- Merkle 构建与 root 持久化
- Contract Adapter 的 `setFinalRoot/requestRandom`
- Indexer 基础同步与 `RandomFulfilled` 投影

### Sprint 2

- winner 计算 + proof 生成
- claim 流程 + 反重放
- 补偿任务（outbox / retry / reconciliation）
- E2E 全链路测试与回归

