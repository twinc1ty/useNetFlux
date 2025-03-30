<template>
  <div class="method-container">
    <div class="w-100 flex flex-row items-center justify-between">
        <p class="text-2xl bold my-2">Response</p>
        <div class="">
            <button @click="copyToClipboard">{{ buttonCta }}</button>
        </div>
    </div>
    <div class="pre-container my-2">
      <!-- <div class="line-numbers">
        <span
          v-for="line in playgroundStoreOpt.formattedResponse.split('\n')
            .length"
          :key="line"
          >{{ line }}</span
        >
      </div> -->
      <!-- Pre tag for formatted JSON -->
      <pre class="pre-with-lines">{{
        playgroundStoreOpt.formattedResponse
      }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
const playgroundStoreOpt = usePlaygroundStoreOpt();

// Button CTA ref state
const buttonCta = ref<string>("Copy");

// Copy function
const copyToClipboard = async () => {
  try {
    if (playgroundStoreOpt.response.length < 0) {
      buttonCta.value = "Response Empty!";
      throw "Empty Response";
    }
    await navigator.clipboard.writeText(
      JSON.stringify(playgroundStoreOpt.response)
    );
    buttonCta.value = "Copied!";

    // This will reset the button CTA back to copy after t seconds (2000ms)
    setTimeout(() => {
      buttonCta.value = "Copy";
    }, 2000);
  } catch (error) {
    /**
     * Probably need a better way to notify the user that something has failed. Can't expect them to check console lol
     * Maybe I'll make a consolse for netflux only.
     */
    console.error("Failed to copy text:", error);
  }
};
</script>

<style scoped>
.pre-container {
  display: flex;
  align-items: flex-start;
  position: relative;
}

.line-numbers {
  padding: 0.5em;
  background-color: #f0f0f0;
  color: #888;
  text-align: right;
  user-select: none;
  border-right: 1px solid #ccc;
  font-family: monospace;
}

.line-numbers span {
  display: block;
  line-height: 1.5em;
}

.textarea-with-lines,
.pre-with-lines {
  flex: 1;
  padding: 0.5em;
  border: none;
  outline: none;
  font-family: monospace;
  line-height: 1.5em;
  resize: none;
}

.textarea-with-lines {
  background-color: #fff;
}

.pre-with-lines {
  background-color: #f9f9f9;
  overflow: auto;
  white-space: pre-wrap;
}
</style>
