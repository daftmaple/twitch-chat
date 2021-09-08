import { useCallback, useEffect } from 'react';
import { TmiHandlerType, TwitchChat } from '~/utils/twitch';
import { TmiMessage } from '~/utils/twitch/type';
import { useMessageQueue } from './queue';
import { useSpeech } from './speech';

interface Props {
  client: TwitchChat;
}

/**
 * This linker links between queue, speech, and the twitch connections
 */
export const useLinker = (props: Props) => {
  const { client } = props;
  const queue = useMessageQueue();
  const speech = useSpeech();

  const triggerSpeech = useCallback(async () => {
    if (queue.countMessages() > 0) {
      const messageToSpeak = await queue.popMessage();
      if (messageToSpeak) {
        speech.speak({
          message: messageToSpeak.message,
          username: messageToSpeak.username,
        });
      }
    }
  }, [queue, speech]);

  // useEffect(() => {
  //   speech.setEndCallback(triggerSpeech);
  // }, [speech, triggerSpeech]);

  const messageHandler = useCallback<TmiHandlerType<TmiMessage>>(
    (payload) => {
      if (payload) {
        queue.addMessage({
          message: payload.message,
          username: payload.username,
          'msg-id': payload[`msg-id`],
        });
        triggerSpeech();
      }
    },
    [queue, triggerSpeech],
  );

  useEffect(() => {
    client.registerMessageHandler(messageHandler);
  }, [client, messageHandler]);
};
