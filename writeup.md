Idk how to do Array and Map builders for Thyme.

Perhaps we reintroduce the idea of type level blocks from a previous debate about
property vs type level blocks? The issue is that Thyme is getting inherently complex
when trying to work with builders.

```json
{
    "name": "Example",
    "thyme": {
        "entityTypeMap": {
            "builder": "MapBuilder",
            "structure": {
                "key": "StringBuilder",
                "value": "VarInt32"
            }
        }
    }
}
```

The beauty with Thyme before the introduction with builder functions was that
it was both explicit and simple. You can directly tell which value mapped to where
and what block handled what.

```json
{
    "name": "Example",
    "thyme": {
        "id": "Uint8",
        "preciseNumber": "Float64"
    }
}
```

However with the introduction of blocks the blocks become mushed together.
Instead of a normal mapping type in place of the value, it's now another
object consisting of a builder -> name property. One would've asked why I
didn't keep the original value structure, and it's because it was to make it
explicit that a builder is being used. It also served to make the logic simpler
programmatically, keeping the block like fashion. The following code block was
what Thyme looks like with a simple builder.

```json
{
    "name": "Example",
    "thyme": {
        "id": "Uint8",
        "message": "StringBuilder",
    }
}
```

The issue came with serving custom
data for the builders. Specifically, the `MapBuilder` and `ArrayBuilder`. Both
builders need explicit structure information in order to know how they should
decode the raw binary data.

---

Proposed new structure for `Registry` template. Instead of doing the normal
register + propertyName method, we have a singular `register()` method.
We'll use AltoMare to register schemas of the intended plugin objects so we
can simplify the integrity check into a one liner.
