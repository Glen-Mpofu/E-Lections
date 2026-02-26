import { StyleSheet, View } from 'react-native'
import React from 'react'

const ThemedView = ({ style, ...props }) => {
    return (
        <View style={[styles.container, style]} {...props} />
    )
}

export default ThemedView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: "100%"
    }
})