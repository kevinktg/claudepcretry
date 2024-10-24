Build with Claude
Computer use (beta)

The upgraded Claude 3.5 Sonnet model is capable of interacting with tools that can manipulate a computer desktop environment.

Computer use is a beta feature. Please be aware that computer use poses unique risks that are distinct from standard API features or chat interfaces. These risks are heightened when using computer use to interact with the internet. To minimize risks, consider taking precautions such as:

    Use a dedicated virtual machine or container with minimal privileges to prevent direct system attacks or accidents.
    Avoid giving the model access to sensitive data, such as account login information, to prevent information theft.
    Limit internet access to an allowlist of domains to reduce exposure to malicious content.
    Ask a human to confirm decisions that may result in meaningful real-world consequences as well as any tasks requiring affirmative consent, such as accepting cookies, executing financial transactions, or agreeing to terms of service.

In some circumstances, Claude will follow commands found in content even if it conflicts with the user’s instructions. For example, Claude instructions on webpages or contained in images may override instructions or cause Claude to make mistakes. We suggest taking precautions to isolate Claude from sensitive data and actions to avoid risks related to prompt injection.

Finally, please inform end users of relevant risks and obtain their consent prior to enabling computer use in your own products.
Computer use reference implementation

Get started quickly with our computer use reference implementation that includes a web interface, Docker container, example tool implementations, and an agent loop.

Please use this form to provide feedback on the quality of the model responses, the API itself, or the quality of the documentation - we cannot wait to hear from you!

Here’s an example of how to provide computer use tools to Claude using the Messages API:

```bash
curl https://api.anthropic.com/v1/messages \
  -H "content-type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: computer-use-2024-10-22" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "tools": [
      {
        "type": "computer_20241022",
        "name": "computer",
        "display_width_px": 1024,
        "display_height_px": 768,
        "display_number": 1
      },
      {
        "type": "text_editor_20241022",
        "name": "str_replace_editor"
      },
      {
        "type": "bash_20241022",
        "name": "bash"
      }
    ],
    "messages": [
      {
        "role": "user",
        "content": "Save a picture of a cat to my desktop."
      }
    ]
  }'
```

```python
import anthropic

client = anthropic.Anthropic()

response = client.beta.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    tools=[
        {
          "type": "computer_20241022",
          "name": "computer",
          "display_width_px": 1024,
          "display_height_px": 768,
          "display_number": 1,
        },
        {
          "type": "text_editor_20241022",
          "name": "str_replace_editor"
        },
        {
          "type": "bash_20241022",
          "name": "bash"
        }
    ],
    messages=[{"role": "user", "content": "Save a picture of a cat to my desktop."}],
    betas=["computer-use-2024-10-22"],
)
print(response)
```

```typescript

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const message = await anthropic.beta.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  tools: [
      {
        type: "computer_20241022",
        name: "computer",
        display_width_px: 1024,
        display_height_px: 768,
        display_number: 1
      },
      {
        type: "text_editor_20241022",
        name: "str_replace_editor"
      },
      {
        type: "bash_20241022",
        name: "bash"
      }
  ],
  messages: [{ role: "user", content: "Save a picture of a cat to my desktop." }],
  betas: ["computer-use-2024-10-22"],
});
console.log(message);
```

How computer use works

1. Provide Claude with computer use tools and a user prompt

    Add Anthropic-defined computer use tools to your API request.
    Include a user prompt that might require these tools, e.g., “Save a picture of a cat to my desktop.”

2. Claude decides to use a tool

    Claude loads the stored computer use tool definitions and assesses if any tools can help with the user’s query.
    If yes, Claude constructs a properly formatted tool use request.
    The API response has a stop_reason of tool_use, signaling Claude’s intent.

3. Extract tool input, evaluate the tool on a computer, and return results

    On your end, extract the tool name and input from Claude’s request.
    Use the tool on a container or Virtual Machine.
    Continue the conversation with a new user message containing a tool_result content block.

4. Claude continues calling computer use tools until it's completed the task

    Claude analyzes the tool results to determine if more tool use is needed or the task has been completed.
    If Claude decides it needs another tool, it responds with another tool_use stop_reason and you should return to step 3.
    Otherwise, it crafts a text response to the user.

We refer to the repetition of steps 3 and 4 without user input as the “agent loop” - i.e., Claude responding with a tool use request and your application responding to Claude with the results of evaluating that request.
​
How to implement computer use
​
Start with our reference implementation

We have built a reference implementation that includes everything you need to get started quickly with computer use:

    A containerized environment suitable for computer use with Claude
    Implementations of the computer use tools
    An agent loop that interacts with the Anthropic API and executes the computer use tools
    A web interface to interact with the container, agent loop, and tools.

We recommend trying the reference implementation out before reading the rest of this documentation.
​
Optimize model performance with prompting

Here are some tips on how to get the best quality outputs:

    Specify simple, well-defined tasks and provide explicit instructions for each step.
    Claude sometimes assumes outcomes of its actions without explicitly checking their results. To prevent this you can prompt Claude with After each step, take a screenshot and carefully evaluate if you have achieved the right outcome. Explicitly show your thinking: "I have evaluated step X..." If not correct, try again. Only when you confirm a step was executed correctly should you move on to the next one.
    Some UI elements (like dropdowns and scrollbars) might be tricky for Claude to manipulate using mouse movements. If you experience this, try prompting the model to use keyboard shortcuts.
    For repeatable tasks or UI interactions, include example screenshots and tool calls of successful outcomes in your prompt.

If you repeatedly encounter a clear set of issues or know in advance the tasks Claude will need to complete, use the system prompt to provide Claude with explicit tips or instructions on how to do the tasks successfully.
​
System prompts

When one of the Anthropic-defined tools is requested via the Anthropic API, a computer use-specific system prompt is generated. It’s similar to the tool use system prompt but starts with:

    You have access to a set of functions you can use to answer the user’s question. This includes access to a sandboxed computing environment. You do NOT currently have the ability to inspect files or interact with external resources, except by invoking the below functions.

As with regular tool use, the user-provided system_prompt field is still respected and used in the construction of the combined system prompt.
​
Understand Anthropic-defined tools

As a beta, these tool definitions are subject to change.

We have provided a set of tools that enable Claude to effectively use computers. When specifying an Anthropic-defined tool, description and tool_schema fields are not necessary or allowed.

Anthropic-defined tools are user executed

Anthropic-defined tools are defined by Anthropic but you must explicitly evaluate the results of the tool and return the tool_results to Claude. As with any tool, the model does not automatically execute the tool.

We currently provide 3 Anthropic-defined tools:

    { "type": "computer_20241022", "name": "computer" }
    { "type": "text_editor_20241022", "name": "str_replace_editor" }
    { "type": "bash_20241022", "name": "bash" }

The type field identifies the tool and its parameters for validation purposes, the name field is the tool name exposed to the model.

If you want to prompt the model to use one of these tools, you can explicitly refer the tool by the name field. The name field must be unique within the tool list; you cannot define a tool with the same name as an Anthropic-defined tool in the same API call.

We do not recommend defining tools with the names of Anthropic-defined tools. While you can still redefine tools with these names (as long as the tool name is unique in your tools block), doing so may result in degraded model performance.

We do not recommend sending screenshots in resolutions above XGA/WXGA to avoid issues related to image resizing. Relying on the image resizing behavior in the API will result in lower model accuracy and slower performance than directly implementing scaling yourself.

The reference repository demonstrates how to scale from higher resolutions to a suggested resolution.
Type

computer_20241022
Parameters

    display_width_px: Required The width of the display being controlled by the model in pixels.
    display_height_px: Required The height of the display being controlled by the model in pixels.
    display_number: Optional The display number to control (only relevant for X11 environments). If specified, the tool will be provided a display number in the tool definition.

Tool description

We are providing our tool description for reference only. You should not specify this in your Anthropic-defined tool call.

Use a mouse and keyboard to interact with a computer, and take screenshots.
* This is an interface to a desktop GUI. You do not have access to a terminal or applications menu. You must click on desktop icons to start applications.
* Some applications may take time to start or process actions, so you may need to wait and take successive screenshots to see the results of your actions. E.g. if you click on Firefox and a window doesn't open, try taking another screenshot.
* The screen's resolution is {{ display_width_px }}x{{ display_height_px }}.
* The display number is {{ display_number }}
* Whenever you intend to move the cursor to click on an element like an icon, you should consult a screenshot to determine the coordinates of the element before moving the cursor.
* If you tried clicking on a program or link but it failed to load, even after waiting, try adjusting your cursor position so that the tip of the cursor visually falls on the element that you want to click.
* Make sure to click any buttons, links, icons, etc with the cursor tip in the center of the element. Don't click boxes on their edges unless asked.

Tool input schema

We are providing our input schema for reference only. You should not specify this in your Anthropic-defined tool call.

{
    "properties": {
        "action": {
            "description": """The action to perform. The available actions are:
                * `key`: Press a key or key-combination on the keyboard.
                  - This supports xdotool's `key` syntax.
                  - Examples: "a", "Return", "alt+Tab", "ctrl+s", "Up", "KP_0" (for the numpad 0 key).
                * `type`: Type a string of text on the keyboard.
                * `cursor_position`: Get the current (x, y) pixel coordinate of the cursor on the screen.
                * `mouse_move`: Move the cursor to a specified (x, y) pixel coordinate on the screen.
                * `left_click`: Click the left mouse button.
                * `left_click_drag`: Click and drag the cursor to a specified (x, y) pixel coordinate on the screen.
                * `right_click`: Click the right mouse button.
                * `middle_click`: Click the middle mouse button.
                * `double_click`: Double-click the left mouse button.
                * `screenshot`: Take a screenshot of the screen.""",
            "enum": [
                "key",
                "type",
                "mouse_move",
                "left_click",
                "left_click_drag",
                "right_click",
                "middle_click",
                "double_click",
                "screenshot",
                "cursor_position",
            ],
            "type": "string",
        },
        "coordinate": {
            "description": "(x, y): The x (pixels from the left edge) and y (pixels from the top edge) coordinates to move the mouse to. Required only by `action=mouse_move` and `action=left_click_drag`.",
            "type": "array",
        },
        "text": {
            "description": "Required only by `action=type` and `action=key`.",
            "type": "string",
        },
    },
    "required": ["action"],
    "type": "object",
}

Type

text_editor_20241022
Tool description

We are providing our tool description for reference only. You should not specify this in your Anthropic-defined tool call.

Custom editing tool for viewing, creating and editing files
* State is persistent across command calls and discussions with the user
* If `path` is a file, `view` displays the result of applying `cat -n`. If `path` is a directory, `view` lists non-hidden files and directories up to 2 levels deep
* The `create` command cannot be used if the specified `path` already exists as a file
* If a `command` generates a long output, it will be truncated and marked with `<response clipped>`
* The `undo_edit` command will revert the last edit made to the file at `path`

Notes for using the `str_replace` command:
* The `old_str` parameter should match EXACTLY one or more consecutive lines from the original file. Be mindful of whitespaces!
* If the `old_str` parameter is not unique in the file, the replacement will not be performed. Make sure to include enough context in `old_str` to make it unique
* The `new_str` parameter should contain the edited lines that should replace the `old_str`

Tool input schema

We are providing our input schema for reference only. You should not specify this in your Anthropic-defined tool call.

{
    "properties": {
        "command": {
            "description": "The commands to run. Allowed options are: `view`, `create`, `str_replace`, `insert`, `undo_edit`.",
            "enum": ["view", "create", "str_replace", "insert", "undo_edit"],
            "type": "string",
        },
        "file_text": {
            "description": "Required parameter of `create` command, with the content of the file to be created.",
            "type": "string",
        },
        "insert_line": {
            "description": "Required parameter of `insert` command. The `new_str` will be inserted AFTER the line `insert_line` of `path`.",
            "type": "integer",
        },
        "new_str": {
            "description": "Optional parameter of `str_replace` command containing the new string (if not given, no string will be added). Required parameter of `insert` command containing the string to insert.",
            "type": "string",
        },
        "old_str": {
            "description": "Required parameter of `str_replace` command containing the string in `path` to replace.",
            "type": "string",
        },
        "path": {
            "description": "Absolute path to file or directory, e.g. `/repo/file.py` or `/repo`.",
            "type": "string",
        },
        "view_range": {
            "description": "Optional parameter of `view` command when `path` points to a file. If none is given, the full file is shown. If provided, the file will be shown in the indicated line number range, e.g. [11, 12] will show lines 11 and 12. Indexing at 1 to start. Setting `[start_line, -1]` shows all lines from `start_line` to the end of the file.",
            "items": {"type": "integer"},
            "type": "array",
        },
    },
    "required": ["command", "path"],
    "type": "object",
}

Type

bash_20241022
Tool description

We are providing our tool description for reference only. You should not specify this in your Anthropic-defined tool call.

Run commands in a bash shell
* When invoking this tool, the contents of the "command" parameter does NOT need to be XML-escaped.
* You have access to a mirror of common linux and python packages via apt and pip.
* State is persistent across command calls and discussions with the user.
* To inspect a particular line range of a file, e.g. lines 10-25, try 'sed -n 10,25p /path/to/the/file'.
* Please avoid commands that may produce a very large amount of output.
* Please run long lived commands in the background, e.g. 'sleep 10 &' or start a server in the background.

Tool input schema

We are providing our input schema for reference only. You should not specify this in your Anthropic-defined tool call.

{
    "properties": {
        "command": {
            "description": "The bash command to run. Required unless the tool is being restarted.",
            "type": "string",
        },
        "restart": {
            "description": "Specifying true will restart this tool. Otherwise, leave this unspecified.",
            "type": "boolean",
        },
    }
}

​
Combine computer use with other tools

You can combine regular tool use with the Anthropic-defined tools for computer use.

```bash
curl https://api.anthropic.com/v1/messages \
  -H "content-type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: computer-use-2024-10-22" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "tools": [
      {
        "type": "computer_20241022",
        "name": "computer"
        "display_width_px": 1024,
        "display_height_px": 768,
        "display_number": 1
      },
      {
        "type": "text_editor_20241022",
        "name": "str_replace_editor"
      },
      {
        "type": "bash_20241022",
        "name": "bash"
      },
      {
        "name": "get_weather",
        "description": "Get the current weather in a given location",
        "input_schema": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "The city and state, e.g. San Francisco, CA"
            },
            "unit": {
              "type": "string",
              "enum": ["celsius", "fahrenheit"],
              "description": "The unit of temperature, either 'celsius' or 'fahrenheit'"
            }
          },
          "required": ["location"]
        }
      },
    ],
    "messages": [
      {
        "role": "user",
        "content": "Find flights from San Francisco to a place with warmer weather."
      }
    ]
  }'
```

```python
import anthropic

client = anthropic.Anthropic()

response = client.beta.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    tools=[
        {
          "type": "computer_20241022",
          "name": "computer",
          "display_width_px": 1024,
          "display_height_px": 768,
          "display_number": 1,
        },
        {
          "type": "text_editor_20241022",
          "name": "str_replace_editor"
        },
        {
          "type": "bash_20241022",
          "name": "bash"
        },
        {
          "name": "get_weather",
          "description": "Get the current weather in a given location",
          "input_schema": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "The city and state, e.g. San Francisco, CA"
              },
              "unit": {
                "type": "string",
                "enum": ["celsius", "fahrenheit"],
                "description": "The unit of temperature, either 'celsius' or 'fahrenheit'"
              }
            },
            "required": ["location"]
          }
        },
    ],
    messages=[{"role": "user", "content": "Find flights from San Francisco to a place with warmer weather."}],
    betas=["computer-use-2024-10-22"],
)
print(response)
```

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const message = await anthropic.beta.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  tools: [
      {
        type: "computer_20241022",
        name: "computer",
        display_width_px: 1024,
        display_height_px: 768,
        display_number: 1,
      },
      {
        type: "text_editor_20241022",
        name: "str_replace_editor"
      },
      {
        type: "bash_20241022",
        name: "bash"
      },
      {
        name: "get_weather",
        description: "Get the current weather in a given location",
        input_schema: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "The city and state, e.g. San Francisco, CA"
            },
            unit: {
              type: "string",
              enum: ["celsius", "fahrenheit"],
              description: "The unit of temperature, either 'celsius' or 'fahrenheit'"
            }
          },
          required: ["location"]
        }
      },
  ],
  messages: [{ role: "user", content: "Find flights from San Francisco to a place with warmer weather." }],
  betas: ["computer-use-2024-10-22"],
});
console.log(message_batch);
```

Build a custom computer use environment

The reference implementation is meant to help you get started with computer use. It includes all of the components needed have Claude use a computer. However, you can build your own environment for computer use to suit your needs. You’ll need:

    A virtualized or containerized environment suitable for computer use with Claude
    An implementation of at least one of the Anthropic-defined computer use tools
    An agent loop that interacts with the Anthropic API and executes the tool_use results using your tool implementations
    An API or UI that allows user input to start the agent loop

​
Understand computer use limitations

The computer use functionality is in beta. While Claude’s capabilities are cutting edge, developers should be aware of its limitations:

    Latency: the current computer use latency for human-AI interactions may be too slow compared to regular human-directed computer actions. We recommend focusing on use cases where speed isn’t critical (e.g., background information gathering, automated software testing) in trusted environments.
    Computer vision accuracy and reliability: Claude may make mistakes or hallucinate when outputting specific coordinates while generating actions.
    Tool selection accuracy and reliability: Claude may make mistakes or hallucinate when selecting tools while generating actions or take unexpected actions to solve problems. Additionally, reliability may be lower when interacting with niche applications or multiple applications at once. We recommend that users prompt the model carefully when requesting complex tasks.
    Scrolling reliability: Scrolling may be unreliable in the current experience, and the model may not reliably scroll to the bottom of a page. Scrolling-like behavior can be improved via keystrokes (PgUp/PgDown).
    Spreadsheet interaction: Mouse clicks for spreadsheet interaction are unreliable. Cell selection may not always work as expected. This can be mitigated by prompting the model to use arrow keys.
    Account creation and content generation on social and communications platforms: While Claude will visit websites, we are limiting its ability to create accounts or generate and share content or otherwise engage in human impersonation across social media websites and platforms. We may update this capability in the future.
    Vulnerabilities: Vulnerabilities like jailbreaking or prompt injection may persist across frontier AI systems, including the beta computer use API. In some circumstances, Claude will follow commands found in content, sometimes even in conflict with the user’s instructions. For example, Claude instructions on webpages or contained in images may override instructions or cause Claude to make mistakes. We recommend: a. Limiting computer use to trusted environments such as virtual machines or containers with minimal privileges b. Avoiding giving computer use access to sensitive accounts or data without strict oversight c. Informing end users of relevant risks and obtaining their consent before enabling or requesting permissions necessary for computer use features in your applications
    Inappropriate or illegal actions: Per Anthropic’s terms of service, you must not employ computer use to violate any laws or our Acceptable Use Policy.

Always carefully review and verify Claude’s computer use actions and logs. Do not use Claude for tasks requiring perfect precision or sensitive user information without human oversight.
​
Pricing

See the tool use pricing documentation for a detailed explanation of how Claude Tool Use API requests are priced.

As a subset of tool use requests, computer use requests are priced the same as any other Claude API request.

We also automatically include a special system prompt for the model, which enables computer use.
Model	Tool choice	System prompt token count
Claude 3.5 Sonnet (new)	autoany, tool	466 tokens499 tokens

In addition to the base tokens, the following additional input tokens are needed for the Anthropic-defined tools:
Tool	Additional input tokens
computer_20241022	683 tokens
text_editor_20241022	700 tokens
bash_20241022	245 tokens