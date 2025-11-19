import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TokenPackage = {
    id: string
    tokens: number
    price: number
    popular?: boolean
    bonus?: number
}

const tokenPackages: TokenPackage[] = [
    { id: "1", tokens: 100, price: 10 },
    { id: "2", tokens: 250, price: 20, bonus: 25 },
    { id: "3", tokens: 500, price: 50, popular: true, bonus: 100 },
    { id: "4", tokens: 1000, price: 70, bonus: 250 },
]

export default function GanarScreen() {
    const router = useRouter();
    const handleEarnAction = (action: string) => {
        // TODO: Implementar lógica para cada acción
        console.log(`Acción seleccionada: ${action}`)
    }

    const handlePurchase = (packageId: string) => {
        // TODO: Implementar lógica de compra
        console.log(`Comprar paquete: ${packageId}`)
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerIcon}>
                        <Text style={{ fontSize: 24 }}>💰</Text>
                    </View>
                    <View>
                        <Text style={styles.title}>Ganar Tokens</Text>
                        <Text style={styles.subtitle}>Aumenta tu saldo de tokens</Text>
                    </View>
                </View>

                {/* Sección: Ganar Tokens Gratis */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="gift" size={20} color="#10B981" />
                        <Text style={styles.sectionTitle}>Ganar Gratis</Text>
                    </View>

                    <TouchableOpacity style={styles.earnCard} onPress={() => handleEarnAction("reseñas")} activeOpacity={0.7}>
                        <View style={[styles.earnIconContainer, { backgroundColor: "#DBEAFE" }]}>
                            <Ionicons name="star" size={32} color="#3B82F6" />
                        </View>
                        <View style={styles.earnContent}>
                            <Text style={styles.earnTitle}>Dar Reseñas</Text>
                            <Text style={styles.earnDescription}>Gana tokens dejando reseñas de los objetos que alquilaste</Text>
                            <View style={styles.earnReward}>
                                <Text style={{ fontSize: 16 }}>💰</Text>
                                <Text style={styles.earnRewardText}>+5 tokens</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#D4D4D4" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.earnCard} onPress={() => handleEarnAction("devolver")} activeOpacity={0.7}>
                        <View style={[styles.earnIconContainer, { backgroundColor: "#D1FAE5" }]}>
                            <Ionicons name="time" size={32} color="#10B981" />
                        </View>
                        <View style={styles.earnContent}>
                            <Text style={styles.earnTitle}>Devolver a Tiempo</Text>
                            <Text style={styles.earnDescription}>Recibe tokens por devolver los objetos alquilados a tiempo</Text>
                            <View style={styles.earnReward}>
                                <Text style={{ fontSize: 16 }}>💰</Text>
                                <Text style={styles.earnRewardText}>+10 tokens</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#D4D4D4" />
                    </TouchableOpacity>

                    {/* Invitar Amigos */}
                    <TouchableOpacity style={styles.earnCard} onPress={() => router.push('../ReferidosScreen' as any)}
activeOpacity={0.7}>
                        <View style={[styles.earnIconContainer, { backgroundColor: "#E0E7FF" }]}>
                            <Ionicons name="people" size={32} color="#6366F1" />
                        </View>
                        <View style={styles.earnContent}>
                            <Text style={styles.earnTitle}>Invita Amigos</Text>
                            <Text style={styles.earnDescription}>Recibe tokens por cada amigo que se una usando tu código</Text>
                            <View style={styles.earnReward}>
                                <Text style={{ fontSize: 16 }}>💰</Text>
                                <Text style={styles.earnRewardText}>+25 tokens</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#D4D4D4" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.earnCard} onPress={() => router.push('../CompleteMissionsScreen' as any)} activeOpacity={0.7}>
                        <View style={[styles.earnIconContainer, { backgroundColor: "#FEF3C7" }]}>
                            <Ionicons name="checkmark-circle" size={32} color="#F59E0B" />
                        </View>
                        <View style={styles.earnContent}>
                            <Text style={styles.earnTitle}>Completar Misiones</Text>
                            <Text style={styles.earnDescription}>Completa misiones especiales y gana tokens extra</Text>
                            <View style={styles.earnReward}>
                                <Text style={{ fontSize: 16 }}>💰</Text>
                                <Text style={styles.earnRewardText}>+10 tokens</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#D4D4D4" />
                    </TouchableOpacity>

                </View>

                {/* Sección: Comprar Tokens */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="cart" size={20} color="#6366F1" />
                        <Text style={styles.sectionTitle}>Comprar Tokens</Text>
                    </View>
                    <Text style={styles.sectionSubtitle}>Obtén tokens al instante con nuestras ofertas especiales</Text>

                    <View style={styles.packagesGrid}>
                        {tokenPackages.map((pkg) => (
                            <TouchableOpacity
                                key={pkg.id}
                                style={[styles.packageCard, pkg.popular && styles.popularPackage]}
                                onPress={() => handlePurchase(pkg.id)}
                                activeOpacity={0.8}
                            >
                                {pkg.popular && (
                                    <View style={styles.popularBadge}>
                                        <Ionicons name="star" size={12} color="#FFFFFF" />
                                        <Text style={styles.popularText}>Popular</Text>
                                    </View>
                                )}

                                <View style={styles.packageHeader}>
                                    <Text style={{ fontSize: 32 }}>💰</Text>
                                    <Text style={styles.packageTokens}>{pkg.tokens}</Text>
                                    <Text style={styles.packageTokensLabel}>tokens</Text>
                                </View>

                                {pkg.bonus && (
                                    <View style={styles.bonusBadge}>
                                        <Ionicons name="add-circle" size={14} color="#10B981" />
                                        <Text style={styles.bonusText}>+{pkg.bonus} bonus</Text>
                                    </View>
                                )}

                                <View style={styles.packageFooter}>
                                    <Text style={styles.packagePrice}>Bs {pkg.price}</Text>
                                    <View style={styles.buyButton}>
                                        <Text style={styles.buyButtonText}>Comprar</Text>
                                        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Info adicional */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={24} color="#6366F1" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>Información</Text>
                        <Text style={styles.infoText}>
                            Los tokens te permiten alquilar objetos en la plataforma. Gana tokens dando reseñas, devolviendo a tiempo,
                            invitando amigos o compra paquetes para aumentar tu saldo.
                        </Text>
                    </View>
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
    section: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0A0A0A",
    },
    sectionSubtitle: {
        fontSize: 14,
        color: "#737373",
        marginBottom: 16,
    },
    earnCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E5E5E5",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    earnIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    earnContent: {
        flex: 1,
    },
    earnTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: 4,
    },
    earnDescription: {
        fontSize: 13,
        color: "#737373",
        marginBottom: 8,
        lineHeight: 18,
    },
    earnReward: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    earnRewardText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#10B981",
    },
    packagesGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    packageCard: {
        width: "48%",
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E5E5E5",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        position: "relative",
    },
    popularPackage: {
        borderWidth: 2,
        borderColor: "#6366F1",
        shadowColor: "#6366F1",
        shadowOpacity: 0.2,
    },
    popularBadge: {
        position: "absolute",
        top: -8,
        right: 12,
        backgroundColor: "#6366F1",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    popularText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    packageHeader: {
        alignItems: "center",
        marginBottom: 12,
    },
    packageTokens: {
        fontSize: 32,
        fontWeight: "700",
        color: "#0A0A0A",
        marginTop: 8,
    },
    packageTokensLabel: {
        fontSize: 13,
        color: "#737373",
    },
    bonusBadge: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        backgroundColor: "#D1FAE5",
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        marginBottom: 12,
    },
    bonusText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#10B981",
    },
    packageFooter: {
        alignItems: "center",
        gap: 8,
    },
    packagePrice: {
        fontSize: 24,
        fontWeight: "700",
        color: "#0A0A0A",
    },
    buyButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: "#6366F1",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        width: "100%",
    },
    buyButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    infoCard: {
        flexDirection: "row",
        backgroundColor: "#EEF2FF",
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#C7D2FE",
        gap: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: "#737373",
        lineHeight: 18,
    },
})
