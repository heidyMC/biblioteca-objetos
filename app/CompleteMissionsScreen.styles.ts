import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 20,
    zIndex: 1,
    padding: 4,
  },
  closeButtonDisabled: {
    opacity: 0.5,
  },
  closeButtonTextDisabled: {
    color: "#adb5bd",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  missionsContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  missionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  missionCardCompleted: {
    backgroundColor: "#e8f5e8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
  },
  missionCardClaimed: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    opacity: 0.7,
  },
  missionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  missionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  missionInfo: {
    flex: 1,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  missionDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  rewardContainer: {
    alignItems: "center",
  },
  rewardText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#28a745",
  },
  rewardLabel: {
    fontSize: 12,
    color: "#666",
  },
  missionFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  pendingBadge: {
    backgroundColor: "#ffc107",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pendingText: {
    color: "#212529",
    fontSize: 12,
    fontWeight: "600",
  },
  completedBadge: {
    backgroundColor: "#28a745",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  claimedBadge: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  claimedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    alignItems: "center",
    padding: 20,
  },
  celebrationModal: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "100%",
    maxWidth: 350,
  },
  confetti: {
    fontSize: 48,
    marginBottom: 16,
  },
  congratsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  congratsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  rewardTextModal: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#28a745",
    marginBottom: 24,
  },
  claimButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  claimButtonDisabled: {
    backgroundColor: "#6c757d",
  },
  claimButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  claimButtonTextDisabled: {
    color: "#dee2e6",
  },
  closeButton: {
    marginTop: 12,
    padding: 8,
  },
  closeButtonText: {
    color: "#666",
    fontSize: 14,
  },
  // Skeleton Styles
  skeletonMissionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  skeletonMissionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    marginRight: 12,
  },
  skeletonMissionInfo: {
    flex: 1,
  },
  skeletonTitle: {
    height: 18,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 8,
    width: "70%",
  },
  skeletonDescription: {
    height: 14,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    width: "90%",
  },
  skeletonRewardContainer: {
    alignItems: "center",
  },
  skeletonRewardText: {
    height: 18,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    width: 40,
    marginBottom: 4,
  },
  skeletonRewardLabel: {
    height: 12,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    width: 30,
  },
  skeletonMissionFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  skeletonBadge: {
    height: 24,
    backgroundColor: "#e0e0e0",
    borderRadius: 16,
    width: 80,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
