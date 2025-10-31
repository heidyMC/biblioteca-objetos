"use client"

import TextComponent from "@/components/ui/text-component"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect, useState } from "react"
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { supabase } from "../../lib/supabase"

type RankingUser = {
    id: string
    nombre: string
    tokens_disponibles: number
    foto_url: string
    rank: number
}

type CurrentUserRank = {
    rank: number
    total: number
    tokens: number // Agregado tokens del usuario actual
}

export default function RankingScreen() {
    const [topUsers, setTopUsers] = useState<RankingUser[]>([])
    const [currentUserRank, setCurrentUserRank] = useState<CurrentUserRank | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)

            const userData = await AsyncStorage.getItem("usuario")
            let userId: string | null = null
            if (userData) {
                const user = JSON.parse(userData)
                userId = user.id
                setCurrentUserId(userId)
            }

            const { data: topUsersData, error: topError } = await supabase
                .from("usuarios")
                .select("id, nombre, tokens_disponibles, foto_url")
                .order("tokens_disponibles", { ascending: false })
                .limit(10)

            if (!topError && topUsersData) {
                const rankedUsers = topUsersData.map((user, index) => ({
                    ...user,
                    rank: index + 1,
                }))
                setTopUsers(rankedUsers)
            }

            if (userId) {
                const { data: currentUserData } = await supabase
                    .from("usuarios")
                    .select("tokens_disponibles")
                    .eq("id", userId)
                    .single()

                if (currentUserData) {
                    const { count: usersAbove } = await supabase
                        .from("usuarios")
                        .select("*", { count: "exact", head: true })
                        .gt("tokens_disponibles", currentUserData.tokens_disponibles)

                    const { count: totalUsers } = await supabase.from("usuarios").select("*", { count: "exact", head: true })

                    setCurrentUserRank({
                        rank: (usersAbove || 0) + 1,
                        total: totalUsers || 0,
                        tokens: currentUserData.tokens_disponibles, // Guardar tokens del usuario
                    })
                }
            }

            setLoading(false)
        }

        loadData()
    }, [])

    const topThree = topUsers.slice(0, 3)
    const others = topUsers.slice(3)

    const getRankColor = (rank: number) => {
        if (rank === 1) return "#FBBF24"
        if (rank === 2) return "#9CA3AF"
        if (rank === 3) return "#D97706"
        return "#737373"
    }

    const isCurrentUser = (userId: string) => userId === currentUserId

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <TextComponent text="Cargando ranking..." textSize={16} textColor="#737373" style={{ marginTop: 10 }} />
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.headerIcon}>
                        <Ionicons name="trophy" size={24} color="#FBBF24" />
                    </View>
                    <View>
                        <Text style={styles.title}>Ranking</Text>
                        <Text style={styles.subtitle}>Usuarios con más tokens</Text>
                    </View>
                </View>

                {currentUserRank && (
                    <View style={styles.currentUserCard}>
                        <View style={styles.currentUserHeader}>
                            <Ionicons name="person-circle" size={24} color="#6366F1" />
                            <TextComponent text="Tu Posición" fontWeight="bold" textSize={16} textColor="#0A0A0A" />
                        </View>
                        <View style={styles.currentUserStats}>
                            <View style={styles.statItem}>
                                <TextComponent text="Puesto" textSize={12} textColor="#737373" />
                                <TextComponent text={`#${currentUserRank.rank}`} fontWeight="bold" textSize={28} textColor="#6366F1" />
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <TextComponent text="De un total de" textSize={12} textColor="#737373" />
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                    <Text style={{ fontSize: 20 }}>💰</Text>
                                    <TextComponent
                                        text={`${currentUserRank.tokens}`}
                                        fontWeight="bold"
                                        textSize={28}
                                        textColor="#0A0A0A"
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.podiumCard}>
                    <Text style={styles.podiumTitle}>🏆 Top 3 🏆</Text>
                    <View style={styles.podiumContainer}>
                        {/* First Place - Arriba y centrado */}
                        {topThree[0] && (
                            <View style={styles.firstPlaceContainer}>
                                <Ionicons name="medal" size={48} color="#FBBF24" />
                                {topThree[0].foto_url ? (
                                    <Image source={{ uri: topThree[0].foto_url }} style={styles.firstPlaceImage} />
                                ) : (
                                    <View style={[styles.firstPlaceImage, styles.placeholderImage]}>
                                        <Ionicons name="person" size={48} color="#9CA3AF" />
                                    </View>
                                )}
                                <View style={styles.firstPlaceBadge}>
                                    <Text style={styles.firstPlaceNumber}>1</Text>
                                </View>
                                <Text
                                    style={[styles.firstPlaceName, isCurrentUser(topThree[0].id) && styles.currentUserText]}
                                    numberOfLines={2}
                                >
                                    {topThree[0].nombre}
                                    {isCurrentUser(topThree[0].id) && " (Tú)"}
                                </Text>
                                <View style={styles.firstPlaceTokens}>
                                    <Text style={{ fontSize: 20 }}>💰</Text>
                                    <Text style={styles.firstPlaceTokensText}>{topThree[0].tokens_disponibles}</Text>
                                </View>
                            </View>
                        )}

                        {/* Second and Third Place - Abajo a los costados */}
                        <View style={styles.secondThirdContainer}>
                            {/* Second Place */}
                            {topThree[1] && (
                                <View style={styles.sidePlace}>
                                    <Ionicons name="medal" size={36} color="#9CA3AF" />
                                    {topThree[1].foto_url ? (
                                        <Image source={{ uri: topThree[1].foto_url }} style={styles.sidePlaceImage} />
                                    ) : (
                                        <View style={[styles.sidePlaceImage, styles.placeholderImage]}>
                                            <Ionicons name="person" size={32} color="#9CA3AF" />
                                        </View>
                                    )}
                                    <View style={[styles.sidePlaceBadge, { backgroundColor: "#F3F4F6", borderColor: "#9CA3AF" }]}>
                                        <Text style={styles.sidePlaceNumber}>2</Text>
                                    </View>
                                    <Text
                                        style={[styles.sidePlaceName, isCurrentUser(topThree[1].id) && styles.currentUserText]}
                                        numberOfLines={2}
                                    >
                                        {topThree[1].nombre}
                                        {isCurrentUser(topThree[1].id) && " (Tú)"}
                                    </Text>
                                    <View style={styles.sidePlaceTokens}>
                                        <Text style={{ fontSize: 16 }}>💰</Text>
                                        <Text style={styles.sidePlaceTokensText}>{topThree[1].tokens_disponibles}</Text>
                                    </View>
                                </View>
                            )}

                            {/* Third Place */}
                            {topThree[2] && (
                                <View style={styles.sidePlace}>
                                    <Ionicons name="medal" size={36} color="#D97706" />
                                    {topThree[2].foto_url ? (
                                        <Image source={{ uri: topThree[2].foto_url }} style={styles.sidePlaceImage} />
                                    ) : (
                                        <View style={[styles.sidePlaceImage, styles.placeholderImage]}>
                                            <Ionicons name="person" size={32} color="#9CA3AF" />
                                        </View>
                                    )}
                                    <View style={[styles.sidePlaceBadge, { backgroundColor: "#FEF3C7", borderColor: "#D97706" }]}>
                                        <Text style={styles.sidePlaceNumber}>3</Text>
                                    </View>
                                    <Text
                                        style={[styles.sidePlaceName, isCurrentUser(topThree[2].id) && styles.currentUserText]}
                                        numberOfLines={2}
                                    >
                                        {topThree[2].nombre}
                                        {isCurrentUser(topThree[2].id) && " (Tú)"}
                                    </Text>
                                    <View style={styles.sidePlaceTokens}>
                                        <Text style={{ fontSize: 16 }}>💰</Text>
                                        <Text style={styles.sidePlaceTokensText}>{topThree[2].tokens_disponibles}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {others.length > 0 && (
                    <View style={styles.listCard}>
                        <View style={styles.listHeader}>
                            <Ionicons name="trending-up" size={20} color="#6366F1" />
                            <Text style={styles.listTitle}>Clasificación General</Text>
                        </View>
                        {others.map((user) => (
                            <View key={user.id} style={[styles.listItem, isCurrentUser(user.id) && styles.currentUserListItem]}>
                                <View style={styles.rankBadge}>
                                    <Text style={[styles.rankNumber, { color: getRankColor(user.rank) }]}>{user.rank}</Text>
                                </View>
                                {user.foto_url ? (
                                    <Image source={{ uri: user.foto_url }} style={styles.listUserImage} />
                                ) : (
                                    <View style={[styles.listUserImage, styles.placeholderImage]}>
                                        <Ionicons name="person" size={20} color="#9CA3AF" />
                                    </View>
                                )}
                                <View style={styles.userInfo}>
                                    <Text style={[styles.userName, isCurrentUser(user.id) && styles.currentUserText]}>
                                        {user.nombre}
                                        {isCurrentUser(user.id) && " (Tú)"}
                                    </Text>
                                </View>
                                <View style={styles.userTokens}>
                                    <Text style={{ fontSize: 16 }}>💰</Text>
                                    <Text style={styles.userTokensText}>{user.tokens_disponibles}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAFAFA",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
        padding: 16,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#FEF3C7",
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#0A0A0A",
    },
    subtitle: {
        fontSize: 14,
        color: "#737373",
    },
    currentUserCard: {
        backgroundColor: "#FFFFFF",
        margin: 16,
        padding: 20,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "#6366F1",
        shadowColor: "#6366F1",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    currentUserHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
    },
    currentUserStats: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
    },
    statItem: {
        alignItems: "center",
        flex: 1,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: "#E5E5E5",
    },
    podiumCard: {
        backgroundColor: "#FFFBEB",
        margin: 16,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#FDE68A",
    },
    podiumTitle: {
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 24,
        color: "#0A0A0A",
    },
    podiumContainer: {
        alignItems: "center",
        gap: 20,
    },
    firstPlaceContainer: {
        alignItems: "center",
        gap: 8,
    },
    firstPlaceImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: "#FBBF24",
        marginTop: 8,
    },
    firstPlaceBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FBBF24",
        justifyContent: "center",
        alignItems: "center",
        marginTop: -20,
        borderWidth: 3,
        borderColor: "#FFFFFF",
    },
    firstPlaceNumber: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    firstPlaceName: {
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
        color: "#0A0A0A",
        marginTop: 4,
    },
    firstPlaceTokens: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 4,
    },
    firstPlaceTokensText: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FBBF24",
    },
    secondThirdContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 32,
        width: "100%",
    },
    sidePlace: {
        alignItems: "center",
        flex: 1,
        gap: 6,
    },
    sidePlaceImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 3,
        borderColor: "#9CA3AF",
        marginTop: 6,
    },
    sidePlaceBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
        marginTop: -16,
        backgroundColor: "#FFFFFF",
    },
    sidePlaceNumber: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0A0A0A",
    },
    sidePlaceName: {
        fontSize: 13,
        fontWeight: "600",
        textAlign: "center",
        color: "#0A0A0A",
        marginTop: 2,
    },
    sidePlaceTokens: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2,
    },
    sidePlaceTokensText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#6366F1",
    },
    placeholderImage: {
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
    },
    listCard: {
        backgroundColor: "#FFFFFF",
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E5E5E5",
    },
    listHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#0A0A0A",
    },
    listItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    currentUserListItem: {
        backgroundColor: "#EEF2FF",
        borderRadius: 8,
        paddingHorizontal: 8,
        borderBottomWidth: 0,
        marginVertical: 4,
    },
    rankBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
    },
    rankNumber: {
        fontSize: 18,
        fontWeight: "700",
    },
    listUserImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "#E5E5E5",
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#0A0A0A",
    },
    currentUserText: {
        color: "#6366F1",
        fontWeight: "700",
    },
    userTokens: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    userTokensText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#6366F1",
    },
})
