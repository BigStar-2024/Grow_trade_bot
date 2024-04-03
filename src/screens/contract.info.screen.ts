import TelegramBot from "node-telegram-bot-api"
import { TokenService } from "../services/token.metadata";
import { birdeyeLink, contractLink, dexscreenerLink, dextoolLink, formatKMB, formatNumber, formatPrice, getPrice } from "../utils";
import { UserService } from "../services/user.service";
import { sendNoneExistTokenNotification, sendNoneUserNotification, sendUsernameRequiredNotification } from "./common.screen";
import { GasFeeEnum, UserTradeSettingService } from "../services/user.trade.setting.service";
import { MsgLogService } from "../services/msglog.service";

export const inline_keyboards = [
  [{ text: "Gas: 0.000105 SOL", command: null }],
  [{ text: "Slippage: 5%", command: 'set_slippage' }],
  [{ text: "-------------Buy------------------", command: null }],
  [{ text: "Buy 0.01 SOL", command: 'buytoken_0.01' }, { text: "Buy 5 SOL", command: 'buytoken_5' }, { text: "Buy X SOL", command: 'buy_custom' }],
  [{ text: "-------------Sell-----------------", command: null }],
  [{ text: "Sell 50%", command: 'selltoken_50' }, { text: "Sell 100%", command: 'selltoken_100' }, { text: "Sell X %", command: 'sell_custom' }],
  [{ text: "🔄 Refresh", command: 'refresh' }, { text: "❌ Close", command: 'close' }],
]

export const ContractInfoScreenHandler = async (bot: TelegramBot, msg: TelegramBot.Message, mint: string) => {
  try {
    const { id: chat_id, username } = msg.chat;

    if (!username) {
      await sendUsernameRequiredNotification(bot, msg);
      return;
    }

    // user
    const user = await UserService.findOne({ username });
    if (!user) {
      await sendNoneUserNotification(bot, msg);
      return;
    }

    // check token metadata
    const tokeninfo = await TokenService.getMintInfo(mint);
    if (!tokeninfo || tokeninfo === "NONE") {
      await sendNoneExistTokenNotification(bot, msg);
      return;
    }
    const { overview, secureinfo } = tokeninfo;
    const { symbol, name, price, mc } = overview;
    const { isToken2022, ownerAddress, freezeAuthority, transferFeeEnable, transferFeeData } = secureinfo;

    const caption = `🌳 Token: <b>${name ?? "undefined"} (${symbol ?? "undefined"})</b> ` +
      `${isToken2022 ? "<i>Token2022</i>" : ""}\n` +
      `<i>${mint}</i>\n\n` +
      `🌳 Mint Disabled: ${ownerAddress ? "🔴" : "🍏"}\n` +
      `🌳 Freeze Disabled: ${freezeAuthority ? "🔴" : "🍏"}\n\n` +
      `💲 Price: <b>$${formatPrice(price)}</b>\n` +
      `📊 Market Cap: <b>$${formatKMB(mc)}</b>\n\n` +
      `💳 <b>Balance: loading... </b>\n` +
      `${contractLink(mint)} • ${birdeyeLink(mint)} • ${dextoolLink(mint)} • ${dexscreenerLink(mint)}`;

    const usersetting = await UserTradeSettingService.get(username, mint);
    const { gas: gasfee, slippage } = usersetting;
    const gaskeyboards = await UserTradeSettingService.getGasInlineKeyboard(gasfee);
    const gasvalue = await UserTradeSettingService.getGasValue(gasfee);

    inline_keyboards[0][0].text = gasvalue;
    inline_keyboards[1][0].text = `Slippage: ${slippage} %`;

    const sentMessage = await bot.sendMessage(
      chat_id,
      caption,
      {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [gaskeyboards, ...inline_keyboards].map((rowItem) => rowItem.map((item) => {
            return {
              text: item.text,
              callback_data: JSON.stringify({
                'command': item.command ?? "dummy_button"
              })
            }
          }))
        }
      }
    );

    await bot.deleteMessage(chat_id, msg.message_id);
    const solbalance = await TokenService.getSOLBalance(user.wallet_address);
    const splbalance = await TokenService.getSPLBalance(mint, user.wallet_address, isToken2022);
    bot.editMessageText(
      caption.replace(
        "Balance: loading...",
        `Balance: ${solbalance.toFixed(6)} SOL\n` +
        `💳 Token: ${splbalance} ${symbol ?? "\n"}`
      ),
      {
        message_id: sentMessage.message_id,
        chat_id,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [gaskeyboards, ...inline_keyboards].map((rowItem) => rowItem.map((item) => {
            return {
              text: item.text,
              callback_data: JSON.stringify({
                'command': item.command ?? "dummy_button"
              })
            }
          }))
        }
      }
    );

    await MsgLogService.create({
      username,
      mint,
      wallet_address: user.wallet_address,
      chat_id,
      msg_id: sentMessage.message_id,
      sol_amount: solbalance,
      spl_amount: splbalance,
    });
  } catch (e) {
    console.log("~ ContractInfoScreenHandler ~", e);
  }
}

export const changeGasFeeHandler = async (bot: TelegramBot, msg: TelegramBot.Message, gasfee: GasFeeEnum) => {
  const chat_id = msg.chat.id;
  const caption = msg.text;
  const username = msg.chat.username;
  const reply_markup = msg.reply_markup
  if (!caption || !username || !reply_markup) return;

  const msglog = await MsgLogService.findOne({
    username,
    msg_id: msg.message_id
  });
  if (!msglog) return;

  const { mint } = msglog;
  const oldone = await UserTradeSettingService.get(username, mint);
  const newone = oldone;
  newone.gas = gasfee;

  await UserTradeSettingService.set(username, mint, newone);
  const gaskeyboards = await UserTradeSettingService.getGasInlineKeyboard(gasfee);
  let inline_keyboard = reply_markup.inline_keyboard;
  inline_keyboard[0] = gaskeyboards.map((item) => {
    return {
      text: item.text,
      callback_data: JSON.stringify({
        'command': item.command
      })
    }
  })

  const gasvalue = await UserTradeSettingService.getGasValue(gasfee);
  inline_keyboard[1][0].text = gasvalue;

  await bot.editMessageReplyMarkup({
    inline_keyboard
  }, {
    message_id: msg.message_id,
    chat_id
  })
}

const getTokenMintFromCallback = (caption: string) => {
  return caption.split("\n")[1];
}
// FPymkKgpg1sLFbVao4JMk4ip8xb8C8uKqfMdARMobHaw
// DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263