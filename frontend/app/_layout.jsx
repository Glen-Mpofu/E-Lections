import { Dimensions, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Slot, Stack } from 'expo-router'
import { useFonts } from "expo-font"

import ToastManager from "toastify-react-native"

const RootLayout = () => {
    const [loaded] = useFonts({
        Caprismo: require("../assets/font/Caprasimo-Regular.ttf"),
    });
    const { height, width } = Dimensions.get("window")
    const toastPlacement = height - 80

    const toastConfig = {
        success: (props) => (
            <View style={{ backgroundColor: 'transparent', padding: 16, borderRadius: 10, position: "absolute", top: toastPlacement }}>
                <Text style={{ fontFamily: "Caprasimo", color: 'green', fontWeight: 'bold', fontSize: 15 }}>{props.text1}</Text>
                {props.text2 && <Text style={{ color: 'green' }}>{props.text2}</Text>}
            </View>
        ),
        error: (props) => (
            <View style={{ backgroundColor: 'transparent', padding: 16, borderRadius: 10, position: "absolute", top: toastPlacement }}>
                <Text style={{ fontFamily: "Caprasimo", color: 'red', fontWeight: 'bold', fontSize: 15 }}>{props.text1}</Text>
                {props.text2 && <Text style={{ color: 'red' }}>{props.text2}</Text>}
            </View>
        ),
        info: (props) => (
            <View style={{ backgroundColor: 'transparent', padding: 16, borderRadius: 10, position: "absolute", top: toastPlacement }}>
                <Text style={{ fontFamily: "Caprasimo", color: 'blue', fontWeight: 'bold' }}>{props.text1}</Text>
                {props.text2 && <Text style={{ color: 'blue' }}>{props.text2}</Text>}
            </View>
        )
    }
    return (
        <>
            <Stack>
                <Stack.Screen name={"index"} options={{ headerShown: false }} />
                <Stack.Screen name={"dashboard"} options={{ headerShown: false }} />
                <Stack.Screen name={"outcome"} options={{ headerShown: false }} />
            </Stack>
            <ToastManager config={toastConfig} style={{ position: "absolute", top: 50, width: "100%", zIndex: 999 }} />
        </>
    )
}

export default RootLayout

const styles = StyleSheet.create({})