<script>
  import { Card} from "smelte";
  import { Button } from "smelte";
  import { Image } from "smelte";

  import Code from "components/Code";

  import card from "examples/card.txt";
</script>

<Card.Card>
  <div slot="title">
    <Card.Title
      title="The three little kittens"
      subheader="A kitten poem"
      avatar="https://placekitten.com/64/64" />
  </div>
  <div slot="media">
    <Image class="w-full" src="https://placekitten.com/300/200" alt="kitty" />
  </div>
  <div slot="text" class="p-5 pb-0 pt-3 text-gray-700 body-2">
    The three little kittens, they lost their mittens,
    <br />
    And they began to cry,
    <br />
    "Oh, mother dear, we sadly fear,
    <br />
    That we have lost our mittens."
  </div>
  <div slot="actions">
    <div class="p-2">
      <Button text>OK</Button>
      <Button text>Meow</Button>
    </div>
  </div>
</Card.Card>

<Code code={card} />
