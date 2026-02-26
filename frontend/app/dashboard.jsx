import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View, FlatList, ImageBackground, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import axios from "axios";
import { Colors } from '../constants/Colors';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Toast } from 'toastify-react-native';
import { BASE_URL } from "@env"

const Dashboard = () => {
    const baseUrl = "http://192.168.101.101:5002";
    const imageUrl = `${baseUrl}/candidate_photos`;

    const [candidates, onCandidatesChange] = useState([]);
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme] ?? Colors.light;
    const [studentVote, setStudentVotes] = useState([]);
    const [counter, setCounter] = useState(0);
    const [userToken, setUserToken] = useState(null);
    const router = useRouter();

    const { height, width } = Dimensions.get("window")

    useEffect(() => {
        async function init() {
            const token = await AsyncStorage.getItem("userToken");
            if (!token) return router.replace("/");
            setUserToken(token)
            alert(`${baseUrl}/getCandidates`)
            try {
                console.log("Fetching candidates from:", `${baseUrl}/getCandidates`);
                const res = await axios.get(`${baseUrl}/getCandidates`);
                console.log("Response:", res.data);
                if (res.data.status === "ok") {
                    onCandidatesChange(res.data.data);
                } else {
                    console.log("Error: candidates not received:", res.data);
                    Toast.show({ type: "error", text1: "Candidates Not Received", useModal: false });
                }
            } catch (err) {
                console.log("Axios Error:", err);
                Toast.show({ type: "error", text1: "Failed to fetch candidates", useModal: false });
            }

        }
        init();
    }, []);

    async function placeVotes() {
        //alert(studentVote)

        await axios.post(`${baseUrl}/placeVotes`, { studentVote },
            {
                headers: { Authorization: `Bearer ${userToken}` }
            }).then((res) => {
                if (res.data.status === "ok") {
                    Toast.show({
                        type: "success",
                        text1: res.data.data,
                        useModal: false
                    })
                    router.push("outcome");
                } else {
                    Toast.show({
                        type: "error",
                        text1: res.data.data,
                        useModal: false
                    })
                }
            }).catch(err => {
                console.error(err);
                alert("Something went wrong");
            })
    }

    function handleVote(candidate) {
        const alreadyVoted = studentVote.some(v => v.studentNumber === candidate.studentnumber);
        if (alreadyVoted) return alert("You already voted for this candidate!");

        if (counter >= 7) return alert("You can only vote for 7 candidates");

        setStudentVotes(prev => [...prev, { studentNumber: candidate.studentnumber, votes: 1, names: candidate.names }]);
        setCounter(prev => prev + 1);
    }

    return (
        <ThemedView style={styles.container}>
            <ImageBackground style={[styles.imageBg, { height: height, width: width }]} source={require("../assets/images/bg.jpg")} resizeMode='cover' />
            <LinearGradient colors={['#B87C4C', '#814C27']} style={styles.header}>
                <ThemedText style={styles.heading}>La-Jazz E-Lections</ThemedText>
                <Text style={styles.subheading}>Vote wisely. max 7 candidates</Text>
            </LinearGradient>

            <FlatList
                data={candidates}
                keyExtractor={(item, index) => index.toString()}
                numColumns={2}
                contentContainerStyle={styles.grid}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    const voted = studentVote.some(v => v.studentNumber === item.studentnumber);
                    return (
                        <View style={[styles.card, voted && { borderColor: "#B87C4C", borderWidth: 2 }]}>
                            <Image
                                style={styles.image}
                                source={{ uri: `${imageUrl}/${item.photo.substring(item.photo.lastIndexOf("/") + 1)}` }}
                            />
                            <Text style={styles.name}>{item.names}</Text>
                            <Text style={styles.id}>Stud. Number: {item.studentnumber}</Text>
                            <TouchableOpacity
                                style={[styles.voteButton, voted && { opacity: 0.6 }]}
                                onPress={() => handleVote(item)}
                                disabled={voted}
                            >
                                <LinearGradient colors={['#B87C4C', '#7E3B18']} style={styles.voteGradient}>
                                    <MaterialCommunityIcons name="vote" size={22} color="#fff" />
                                    <Text style={styles.voteText}>{voted ? "VOTED" : "VOTE"}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    );
                }}
            />

            <TouchableOpacity onPress={() => {
                if (counter < 7) {
                    Toast.show({
                        type: "error",
                        text1: "Select 7 candidates to vote for",
                        useModal: false
                    })
                    return;
                } else {
                    placeVotes()
                }


            }} style={styles.placeVoteContainer}>
                <LinearGradient colors={['#D43D3D', '#8C1919']} style={styles.placeVoteButton}>
                    <Text style={styles.placeVoteText}>Place Votes</Text>
                </LinearGradient>
            </TouchableOpacity>

            <View style={styles.counterBox}>
                <Text style={styles.counterText}>Votes Cast: {counter}/7</Text>
            </View>
        </ThemedView>
    );
};

export default Dashboard;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F4F2",
    },
    header: {
        paddingVertical: 35,
        paddingHorizontal: 25,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        alignItems: "center",
    },
    heading: {
        fontSize: 26,
        fontWeight: "700",
        color: "#fff",
    },
    subheading: {
        color: "#F3E5D8",
        marginTop: 5,
    },
    grid: {
        padding: 15,
        justifyContent: "center",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        margin: 10,
        flex: 1,
        alignItems: "center",
        padding: 15,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    image: {
        height: 150,
        width: 150,
        borderRadius: 75,
        marginBottom: 10,
    },
    name: {
        fontSize: 16,
        fontWeight: "600",
        color: "#222",
    },
    id: {
        fontSize: 12,
        color: "#777",
        marginBottom: 10,
    },
    voteButton: {
        width: "80%",
        borderRadius: 12,
        overflow: "hidden",
    },
    voteGradient: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 8,
        borderRadius: 12,
    },
    voteText: {
        color: "#fff",
        marginLeft: 6,
        fontWeight: "600",
        fontSize: 14,
    },
    placeVoteContainer: {
        alignItems: "center",
        marginBottom: 40,
    },
    placeVoteButton: {
        width: 200,
        paddingVertical: 14,
        borderRadius: 15,
        alignItems: "center",
    },
    placeVoteText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
    counterBox: {
        position: "absolute",
        top: 100,
        right: 20,
        backgroundColor: "#fff",
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
    },
    counterText: {
        color: "#333",
        fontWeight: "600",
    },
    imageBg: {
        ...StyleSheet.absoluteFillObject,
    }
});
