import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../generated/NFTContract/ERC721";
import { TokenHolder, Transfer } from "../generated/schema";

export function handleTransfer(event: TransferEvent): void {
  let transfer = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  transfer.from = event.params.from;
  transfer.to = event.params.to;
  transfer.tokenId = event.params.tokenId;
  transfer.blockNumber = event.block.number;
  transfer.blockTimestamp = event.block.timestamp;
  transfer.transactionHash = event.transaction.hash;
  transfer.save();

  // Update sender's holdings
  let fromHolder = TokenHolder.load(event.params.from.toHexString());
  if (fromHolder) {
    let tokenIds = fromHolder.tokenIds;
    let index = tokenIds.indexOf(event.params.tokenId);
    if (index > -1) {
      tokenIds.splice(index, 1);
    }
    fromHolder.tokenIds = tokenIds;
    fromHolder.balance = BigInt.fromI32(tokenIds.length);
    fromHolder.lastUpdated = event.block.timestamp;
    fromHolder.save();
  }

  // Update receiver's holdings
  let toHolder = TokenHolder.load(event.params.to.toHexString());
  if (!toHolder) {
    toHolder = new TokenHolder(event.params.to.toHexString());
    toHolder.address = event.params.to;
    toHolder.tokenIds = [];
    toHolder.balance = BigInt.fromI32(0);
  }
  let newTokenIds = toHolder.tokenIds;
  newTokenIds.push(event.params.tokenId);
  toHolder.tokenIds = newTokenIds;
  toHolder.balance = BigInt.fromI32(newTokenIds.length);
  toHolder.lastUpdated = event.block.timestamp;
  toHolder.save();
}
