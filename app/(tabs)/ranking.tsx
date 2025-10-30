// local mock data to avoid missing module '../lib/mock-data'
type RankingUser = {
    id: number
    name: string
    tokens: number
    rentals: number
    rank: number
}

const mockRanking: RankingUser[] = [
    { id: 1, name: "Ana García", tokens: 1200, rentals: 34, rank: 1 },
    { id: 2, name: "Luis Fernández", tokens: 950, rentals: 28, rank: 2 },
    { id: 3, name: "María López", tokens: 780, rentals: 22, rank: 3 },
    { id: 4, name: "Carlos Pérez", tokens: 600, rentals: 18, rank: 4 },
    { id: 5, name: "Sofía Torres", tokens: 450, rentals: 12, rank: 5 },
    { id: 6, name: "Jorge Martínez", tokens: 300, rentals: 8, rank: 6 },
]

import { Ionicons } from "@expo/vector-icons"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function RankingScreen() {
    const topThree = mockRanking.slice(0, 3)
    const others = mockRanking.slice(3)

    const getRankColor = (rank: number) => {
        if (rank === 1) return "#FBBF24"
        if (rank === 2) return "#9CA3AF"
        if (rank === 3) return "#D97706"
        return "#737373"
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

                <View style={styles.podiumCard}>
                    <Text style={styles.podiumTitle}>🏆 Top 3 🏆</Text>
                    <View style={styles.podium}>
                        {/* Second Place */}
                        <View style={styles.podiumItem}>
                            <Ionicons name="medal" size={32} color="#9CA3AF" />
                            <View style={[styles.podiumCircle, { backgroundColor: "#F3F4F6", borderColor: "#9CA3AF" }]}>
                                <Text style={styles.podiumRank}>2</Text>
                            </View>
                            <Text style={styles.podiumName} numberOfLines={2}>
                                {topThree[1]?.name}
                            </Text>
                            <View style={styles.podiumTokens}>
                                <Ionicons name="cash" size={16} color="#6366F1" />
                                <Text style={styles.podiumTokensText}>{topThree[1]?.tokens}</Text>
                            </View>
                        </View>

                        {/* First Place */}
                        <View style={[styles.podiumItem, styles.podiumFirst]}>
                            <Ionicons name="medal" size={40} color="#FBBF24" />
                            <View
                                style={[
                                    styles.podiumCircle,
                                    styles.podiumCircleFirst,
                                    { backgroundColor: "#FEF3C7", borderColor: "#FBBF24" },
                                ]}
                            >
                                <Text style={[styles.podiumRank, styles.podiumRankFirst]}>1</Text>
                            </View>
                            <Text style={styles.podiumName} numberOfLines={2}>
                                {topThree[0]?.name}
                            </Text>
                            <View style={styles.podiumTokens}>
                                <Ionicons name="cash" size={16} color="#6366F1" />
                                <Text style={styles.podiumTokensText}>{topThree[0]?.tokens}</Text>
                            </View>
                        </View>

                        {/* Third Place */}
                        <View style={styles.podiumItem}>
                            <Ionicons name="medal" size={32} color="#D97706" />
                            <View style={[styles.podiumCircle, { backgroundColor: "#FEF3C7", borderColor: "#D97706" }]}>
                                <Text style={styles.podiumRank}>3</Text>
                            </View>
                            <Text style={styles.podiumName} numberOfLines={2}>
                                {topThree[2]?.name}
                            </Text>
                            <View style={styles.podiumTokens}>
                                <Ionicons name="cash" size={16} color="#6366F1" />
                                <Text style={styles.podiumTokensText}>{topThree[2]?.tokens}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.listCard}>
                    <View style={styles.listHeader}>
                        <Ionicons name="trending-up" size={20} color="#6366F1" />
                        <Text style={styles.listTitle}>Clasificación General</Text>
                    </View>
                    {others.map((user) => (
                        <View key={user.id} style={styles.listItem}>
                            <View style={styles.rankBadge}>
                                <Text style={[styles.rankNumber, { color: getRankColor(user.rank) }]}>{user.rank}</Text>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user.name}</Text>
                                <Text style={styles.userRentals}>{user.rentals} alquileres</Text>
                            </View>
                            <View style={styles.userTokens}>
                                <Ionicons name="cash" size={20} color="#6366F1" />
                                <Text style={styles.userTokensText}>{user.tokens}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAFAFA",
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
    podium: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-end",
        gap: 16,
    },
    podiumItem: {
        alignItems: "center",
        flex: 1,
    },
    podiumFirst: {
        marginBottom: -16,
    },
    podiumCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
        marginBottom: 8,
    },
    podiumCircleFirst: {
        width: 96,
        height: 96,
        borderRadius: 48,
    },
    podiumRank: {
        fontSize: 32,
        fontWeight: "700",
        color: "#0A0A0A",
    },
    podiumRankFirst: {
        fontSize: 40,
    },
    podiumName: {
        fontSize: 12,
        fontWeight: "600",
        textAlign: "center",
        color: "#0A0A0A",
        marginBottom: 4,
    },
    podiumTokens: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    podiumTokensText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#6366F1",
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
        gap: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
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
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#0A0A0A",
    },
    userRentals: {
        fontSize: 12,
        color: "#737373",
        marginTop: 2,
    },
    userTokens: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    userTokensText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#6366F1",
    },
})
