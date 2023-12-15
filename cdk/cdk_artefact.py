"""
Utilities for reading metadata from the CDK artefacts.
"""

import json
import re
from typing import Any, cast


def get_stack_name() -> str:
    """
    look for the stack name in `manifest.json`.
    Fails unless exactly one stack name is found
    """
    f = open("./cdk.out/manifest.json", encoding="utf-8")
    outputs = json.load(f)
    f.close()
    artifacts = cast(dict[str, Any], outputs.get("artifacts", {}))
    stack_names = [k for k in artifacts.keys() if re.match(r".*Stack[A-Z0-9]{8}?$", k)]
    if len(stack_names) == 1:
        return stack_names[0]

    print(artifacts)
    raise TypeError(f"Expected 1 stack name, got {len(stack_names)}")


def get_output(output_name: str, stack_name: str | None = None) -> str:
    """
    Read in a stack output from `cdk.outputs.json`.

    Keyword arguments:

    `output_name` -- the `CfnOutput` name
    `stack_name` -- the Stack name (default: read from `manifest.json`)
    """
    if stack_name is None:
        stack_name = get_stack_name()

    f = open("./cdk.outputs.json", encoding="utf-8")
    outputs = json.load(f)
    f.close()
    output = outputs.get(stack_name, {}).get(output_name)
    assert output is not None
    return output
