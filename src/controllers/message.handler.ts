import TelegramBot from "node-telegram-bot-api";
import { isValidWalletAddress } from "../utils";
import { contractInfoScreenHandler } from "../screens/contract.info.screen";
import {
  AUTO_BUY_TEXT,
  BUY_XSOL_TEXT,
  PRESET_BUY_TEXT,
  SELL_XPRO_TEXT,
  SET_GAS_FEE,
  SET_JITO_FEE,
  SET_SLIPPAGE_TEXT,
  WITHDRAW_TOKEN_AMT_TEXT,
  WITHDRAW_XTOKEN_TEXT,
} from "../bot.opts";
import {
  buyHandler,
  sellHandler,
  setSlippageHandler,
} from "../screens/trade.screen";
import {
  withdrawAddressHandler,
  withdrawHandler,
} from "../screens/transfer.funds";
import {
  presetBuyBtnHandler,
  setCustomAutoBuyAmountHandler,
  setCustomBuyPresetHandler,
  setCustomFeeHandler,
  setCustomJitoFeeHandler,
} from "../screens/settings.screen";

export const messageHandler = async (
  bot: TelegramBot,
  msg: TelegramBot.Message
) => {
  try {
    const messageText = msg.text;
    const { reply_to_message } = msg;

    if (!messageText) return;

    if (reply_to_message && reply_to_message.text) {
      const { text } = reply_to_message;
      // if number, input amount
      const regex = /^[0-9]+(\.[0-9]+)?$/;
      const isNumber = regex.test(messageText) === true;
      const reply_message_id = reply_to_message.message_id;

      if (isNumber) {
        const amount = Number(messageText);

        if (text === BUY_XSOL_TEXT.replace(/<[^>]*>/g, "")) {
          await buyHandler(bot, msg, amount, reply_message_id);
        } else if (text === SELL_XPRO_TEXT.replace(/<[^>]*>/g, "")) {
          await sellHandler(bot, msg, amount, reply_message_id);
        } else if (text === WITHDRAW_XTOKEN_TEXT.replace(/<[^>]*>/g, "")) {
          await withdrawHandler(bot, msg, messageText, reply_message_id);
        } else if (text === SET_SLIPPAGE_TEXT.replace(/<[^>]*>/g, "")) {
          await setSlippageHandler(bot, msg, amount, reply_message_id);
        } else if (text === PRESET_BUY_TEXT.replace(/<[^>]*>/g, "")) {
          await setCustomBuyPresetHandler(bot, msg, amount, reply_message_id);
        } else if (text === AUTO_BUY_TEXT.replace(/<[^>]*>/g, "")) {
          await setCustomAutoBuyAmountHandler(
            bot,
            msg,
            amount,
            reply_message_id
          );
        } else if (text === SET_GAS_FEE.replace(/<[^>]*>/g, "")) {
          await setCustomFeeHandler(bot, msg, amount, reply_message_id);
        } else if (text === SET_JITO_FEE.replace(/<[^>]*>/g, "")) {
          if (amount > 0.0001) {
            await setCustomJitoFeeHandler(bot, msg, amount, reply_message_id);
          } else {
            await setCustomJitoFeeHandler(bot, msg, 0.0001, reply_message_id);
          }
        }
      } else {
        if (text === WITHDRAW_TOKEN_AMT_TEXT.replace(/<[^>]*>/g, "")) {
          await withdrawAddressHandler(bot, msg, messageText, reply_message_id);
        }
      }
      return;
    }

    // // wallet address
    // if (isValidWalletAddress(messageText)) {
    //   await contractInfoScreenHandler(bot, msg, messageText, 'switch_sell');
    //   return;
    // }
    // wallet address
    if (isValidWalletAddress(messageText)) {
      await contractInfoScreenHandler(bot, msg, messageText);
      return;
    }
  } catch (e) {
    console.log("~messageHandler~", e);
  }
};
