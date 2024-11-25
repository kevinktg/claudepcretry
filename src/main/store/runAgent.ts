import {
  BetaMessage,
  BetaMessageParam,
} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { Button, Key, keyboard, mouse, Point } from '@nut-tree-fork/nut-js';
import { desktopCapturer, screen } from 'electron';
import { anthropic } from './anthropic';
import { AppState, NextAction } from './types';
import { extractAction } from './extractAction';

const MAX_STEPS = 50;
const MAX_RETRIES = 3;

function getScreenDimensions(): { width: number; height: number } {
  const { size } = screen.getPrimaryDisplay();
  return size;
}

function getAiScaledScreenDimensions(): { width: number; height: number } {
  const { width, height } = getScreenDimensions();
  const aspectRatio = width / height;

  let scaledWidth: number;
  let scaledHeight: number;

  if (aspectRatio > 1280 / 800) {
    scaledWidth = 1280;
    scaledHeight = Math.round(1280 / aspectRatio);
  } else {
    scaledHeight = 800;
    scaledWidth = Math.round(800 * aspectRatio);
  }

  return { width: scaledWidth, height: scaledHeight };
}

const getScreenshot = async () => {
  const { size: { width, height } } = screen.getPrimaryDisplay();
  const aiDimensions = getAiScaledScreenDimensions();

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width, height },
  });
  const primarySource = sources[0];

  if (primarySource) {
    const screenshot = primarySource.thumbnail;
    const resizedScreenshot = screenshot.resize(aiDimensions);
    const base64Image = resizedScreenshot.toPNG().toString('base64');
    return base64Image;
  }
  throw new Error('No display found for screenshot');
};

const mapToAiSpace = (x: number, y: number) => {
  const { width, height } = getScreenDimensions();
  const aiDimensions = getAiScaledScreenDimensions();
  const { scaleFactor } = screen.getPrimaryDisplay();

  return {
    x: (x * aiDimensions.width * scaleFactor) / width,
    y: (y * aiDimensions.height * scaleFactor) / height,
  };
};

const mapFromAiSpace = (x: number, y: number) => {
  const { width, height } = getScreenDimensions();
  const aiDimensions = getAiScaledScreenDimensions();
  const { scaleFactor } = screen.getPrimaryDisplay();

  return {
    x: (x * width) / (aiDimensions.width * scaleFactor),
    y: (y * height) / (aiDimensions.height * scaleFactor),
  };
};

const promptForAction = async (
  runHistory: BetaMessageParam[],
): Promise<BetaMessageParam> => {
  const historyWithoutImages = runHistory.map((msg, index) => {
    if (index === runHistory.length - 1) return msg;
    if (Array.isArray(msg.content)) {
      return {
        ...msg,
        content: msg.content.map((item) => {
          if (item.type === 'tool_result' && Array.isArray(item.content)) {
            return {
              ...item,
              content: item.content.filter((c) => c.type !== 'image'),
            };
          }
          return item;
        }),
      };
    }
    return msg;
  });

  const message = await anthropic.beta.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    tools: [
      {
        type: 'computer_20241022',
        name: 'computer',
        display_width_px: getAiScaledScreenDimensions().width,
        display_height_px: getAiScaledScreenDimensions().height,
        display_number: 1,
      },
      {
        name: 'finish_run',
        description:
          'Call this function when you have achieved the goal of the task.',
        input_schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the task was successful',
            },
            error: {
              type: 'string',
              description: 'The error message if the task was not successful',
            },
          },
          required: ['success'],
        },
      },
    ],
    system: `The user will ask you to perform a task and you should use their computer to do so. After each step, take a screenshot and carefully evaluate if you have achieved the right outcome. Explicitly show your thinking: "I have evaluated step X..." If not correct, try again with a different approach. Only when you confirm a step was executed correctly should you move on to the next one. Note that you have to click into the browser address bar before typing a URL. You should always call a tool! Always return a tool call. Remember call the finish_run tool when you have achieved the goal of the task. Do not explain you have finished the task, just call the tool. Use keyboard shortcuts to navigate whenever possible.`,
    messages: historyWithoutImages,
    betas: ['computer-use-2024-10-22'],
  });

  return { content: message.content, role: message.role };
};

const tryAlternativeMethod = async (action: NextAction): Promise<void> => {
  switch (action.type) {
    case 'type':
      if (action.text) {
        for (const char of action.text) {
          await keyboard.type(char);
          await new Promise((resolve) => {
            setTimeout(resolve, 50);
          });
        }
      }
      break;
    case 'left_click':
      await mouse.doubleClick(Button.LEFT);
      break;
    case 'mouse_move':
      if ('x' in action && 'y' in action) {
        const currentPos = await mouse.getPosition();
        const steps = 5;
        for (let i = 0; i < steps; i += 1) {
          const stepX = currentPos.x + ((action.x - currentPos.x) * i) / steps;
          const stepY = currentPos.y + ((action.y - currentPos.y) * i) / steps;
          await mouse.setPosition(new Point(stepX, stepY));
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
        }
      }
      break;
    default:
      throw new Error(`No alternative method available for ${action.type}`);
  }
};

export const performAction = async (
  action: NextAction,
  retryCount = 0,
): Promise<void> => {
  if (action.type === 'mouse_move') {
    const aiCoords = { x: action.x, y: action.y };
    const screenCoords = mapFromAiSpace(action.x, action.y);
    console.log('AI Coordinates:', aiCoords);
    console.log('Screen Coordinates:', screenCoords);
  }

  try {
    switch (action.type) {
      case 'mouse_move': {
        const { x, y } = mapFromAiSpace(action.x, action.y);
        await mouse.setPosition(new Point(x, y));
        break;
      }
      case 'left_click_drag': {
        const { x: dragX, y: dragY } = mapFromAiSpace(action.x, action.y);
        const currentPosition = await mouse.getPosition();
        await mouse.drag([currentPosition, new Point(dragX, dragY)]);
        break;
      }
      case 'cursor_position': {
        const position = await mouse.getPosition();
        mapToAiSpace(position.x, position.y);
        break;
      }
      case 'left_click':
        await mouse.leftClick();
        break;
      case 'right_click':
        await mouse.rightClick();
        break;
      case 'middle_click':
        await mouse.click(Button.MIDDLE);
        break;
      case 'double_click':
        await mouse.doubleClick(Button.LEFT);
        break;
      case 'type':
        keyboard.config.autoDelayMs = 0;
        await keyboard.type(action.text);
        keyboard.config.autoDelayMs = 500;
        break;
      case 'key': {
        const keyMap = {
          Return: Key.Enter,
          Tab: Key.Tab,
          Enter: Key.Enter,
          ArrowUp: Key.Up,
          ArrowDown: Key.Down,
          ArrowLeft: Key.Left,
          ArrowRight: Key.Right,
        };

        const keys = action.text.split('+').map((key) => {
          const mappedKey = keyMap[key as keyof typeof keyMap];
          if (!mappedKey) {
            throw new Error(`Tried to press unknown key: ${key}`);
          }
          return mappedKey;
        });

        try {
          await keyboard.pressKey(...keys);
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
          await keyboard.releaseKey(...keys);
        } catch (error) {
          console.error('Error pressing key:', error);
          throw error;
        }
        break;
      }
      case 'screenshot':
        break;
      default:
        throw new Error(`Unsupported action: ${action.type}`);
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(
        `Action failed, trying alternative method (attempt ${retryCount + 1}/${MAX_RETRIES})`,
      );
      try {
        await tryAlternativeMethod(action);
      } catch (alternativeError) {
        return performAction(action, retryCount + 1);
      }
    } else {
      throw new Error(`Action failed after ${MAX_RETRIES} attempts: ${error}`);
    }
  }
  return undefined;
};

export const runAgent = async (
  setState: (state: AppState) => void,
  getState: () => AppState,
) => {
  setState({
    ...getState(),
    running: true,
    error: null,
  });

  while (getState().running) {
    if (getState().runHistory.length >= MAX_STEPS * 2) {
      setState({
        ...getState(),
        error: 'Maximum steps exceeded',
        running: false,
      });
      break;
    }

    try {
      const message = await promptForAction(getState().runHistory);
      setState({
        ...getState(),
        runHistory: [...getState().runHistory, message],
      });
      const { action, reasoning, toolId } = extractAction(
        message as BetaMessage,
      );
      console.log('REASONING', reasoning);
      console.log('ACTION', action);

      if (action.type === 'error') {
        setState({
          ...getState(),
          error: action.message,
          running: false,
        });
        break;
      } else if (action.type === 'finish') {
        setState({
          ...getState(),
          running: false,
        });
        break;
      }
      if (!getState().running) {
        break;
      }

      try {
        await performAction(action);
      } catch (actionError) {
        console.error('Action failed with all retries:', actionError);
        setState({
          ...getState(),
          runHistory: [
            ...getState().runHistory,
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolId,
                  content: [
                    {
                      type: 'text',
                      text: `Action failed: ${actionError}. Please try a different approach.`,
                    },
                  ],
                },
              ],
            },
          ],
        });
        // Let AI try a different approach in next iteration
        // eslint-disable-next-line no-continue
        continue;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
      if (!getState().running) {
        break;
      }

      setState({
        ...getState(),
        runHistory: [
          ...getState().runHistory,
          {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: toolId,
                content: [
                  {
                    type: 'text',
                    text: 'Here is a screenshot after the action was executed',
                  },
                  {
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: 'image/png',
                      data: await getScreenshot(),
                    },
                  },
                ],
              },
            ],
          },
        ],
      });
    } catch (error: unknown) {
      setState({
        ...getState(),
        error:
          error instanceof Error ? error.message : 'An unknown error occurred',
        running: false,
      });
      break;
    }
  }
};
