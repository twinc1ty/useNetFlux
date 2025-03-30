<template>
    <div class="method-container">
        <p class="text-2xl bold my-2">Configure Defaults</p>
        <div class="flex justify-around flex-wrap">
            <div class="box">
                <p class="text-xl font-bold">Edit Default Values</p>
                <div v-for="(value, key, index) in defaultConfig" :key="index" class="my-3">
                    <div class="flex justify-between">

                        <label>{{ useCapitalize(key) }}: </label>

                        <!-- Render text input for strings and numbers -->
                        <input v-if="typeof value === 'string' || typeof value === 'number'" type="text"
                            v-model.number="defaultConfig[key] as number" />


                        <input v-else-if="typeof value === 'boolean'" type="checkbox" class="w-20" v-model="defaultConfig[key]" />

                        <!-- Optionally handle other types if needed -->
                        <span v-else>Unsupported type</span>
                    </div>
                </div>
            </div>
            <div class="box">
                <p class="text-xl font-bold">Live Preview of Default Values</p>

                <pre>
                    {{ defaultConfig }}
                </pre>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useNetFlux, type HttpMethod, defaultConfig } from '~/composable/useNetFlux';
import { useCapitalize } from '~/composable/utility/useCapitalize';
const { updateGlobalConfig } = useNetFlux();

updateGlobalConfig(defaultConfig.value);

</script>

<style scoped>
.box {
    width: 100%;
}

</style>