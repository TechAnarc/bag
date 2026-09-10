import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/adminApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
	User,
	Mail,
	Phone,
	Shield,
	Calendar,
	Clock,
	Edit,
	Lock,
	CheckCircle2,
	Loader2,
} from "lucide-react";
import { format } from "date-fns";

export default function AdminProfilePage() {
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

	// Form states
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	// Fetch profile
	const { data: profileData, isLoading } = useQuery({
		queryKey: ["admin-profile"],
		queryFn: async () => {
			const response = await adminApi.getProfile();
			setName(response.data.name);
			setPhone(response.data.phone || "");
			return response.data;
		},
	});

	// Update profile mutation
	const updateProfileMutation = useMutation({
		mutationFn: async (data: { name?: string; phone?: string }) => {
			return await adminApi.updateProfile(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
			toast({
				title: "Success",
				description: "Profile updated successfully",
			});
			setEditDialogOpen(false);
		},
		onError: (error: any) => {
			toast({
				variant: "destructive",
				title: "Error",
				description: error.response?.data?.message || "Failed to update profile",
			});
		},
	});

	// Update password mutation
	const updatePasswordMutation = useMutation({
		mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
			return await adminApi.updatePassword(data.currentPassword, data.newPassword);
		},
		onSuccess: () => {
			toast({
				title: "Success",
				description: "Password updated successfully",
			});
			setPasswordDialogOpen(false);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		},
		onError: (error: any) => {
			toast({
				variant: "destructive",
				title: "Error",
				description: error.response?.data?.message || "Failed to update password",
			});
		},
	});

	const handleUpdateProfile = () => {
		updateProfileMutation.mutate({
			name: name !== profileData?.name ? name : undefined,
			phone: phone !== profileData?.phone ? phone : undefined,
		});
	};

	const handleUpdatePassword = () => {
		if (newPassword !== confirmPassword) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Passwords do not match",
			});
			return;
		}

		if (newPassword.length < 8) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Password must be at least 8 characters long",
			});
			return;
		}

		updatePasswordMutation.mutate({ currentPassword, newPassword });
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-96">
				<Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			{/* Profile Header Card */}
			<Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700 overflow-hidden">
				<div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600" />
				<CardContent className="relative pb-8">
					<div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16">
						<Avatar className="w-32 h-32 ring-4 ring-slate-900 shadow-xl">
							<AvatarImage src={profileData?.avatar || undefined} />
							<AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl text-white font-bold">
								{profileData?.name?.charAt(0) || "A"}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 text-center md:text-left">
							<div className="flex items-center justify-center md:justify-start gap-3 mb-2">
								<h1 className="text-3xl font-bold text-slate-900 dark:text-white">{profileData?.name}</h1>
								{profileData?.isActive && (
									<Badge className="bg-green-600 text-white">
										<CheckCircle2 className="w-3 h-3 mr-1" />
										Active
									</Badge>
								)}
							</div>
							<p className="text-slate-400">{profileData?.email}</p>
						</div>
						<Button
							onClick={() => setEditDialogOpen(true)}
							className="bg-indigo-600 hover:bg-indigo-700 text-white"
						>
							<Edit className="w-4 h-4 mr-2" />
							Edit Profile
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Details Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Personal Information */}
				<Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
					<CardHeader>
						<CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
							<User className="w-5 h-5 text-indigo-400" />
							Personal Information
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
							<Mail className="w-5 h-5 text-slate-400" />
							<div className="flex-1">
								<p className="text-xs text-slate-500">Email Address</p>
								<p className="text-slate-900 dark:text-white">{profileData?.email}</p>
							</div>
						</div>
						<div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
							<Phone className="w-5 h-5 text-slate-400" />
							<div className="flex-1">
								<p className="text-xs text-slate-500">Phone Number</p>
								<p className="text-slate-900 dark:text-white">{profileData?.phone || "Not provided"}</p>
							</div>
						</div>
						<div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
							<Shield className="w-5 h-5 text-slate-400" />
							<div className="flex-1">
								<p className="text-xs text-slate-500">Role</p>
								<Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
									{profileData?.role}
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Account Activity */}
				<Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
					<CardHeader>
						<CardTitle className="text-white flex items-center gap-2">
							<Clock className="w-5 h-5 text-indigo-400" />
							Account Activity
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
							<Calendar className="w-5 h-5 text-indigo-400" />
							<div className="flex-1">
								<p className="text-xs text-slate-500">Last Login</p>
								<p className="text-slate-900 dark:text-white">
									{profileData?.lastLoginAt
										? format(new Date(profileData.lastLoginAt), "PPpp")
										: "Never"}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
							<Calendar className="w-5 h-5 text-indigo-400" />
							<div className="flex-1">
								<p className="text-xs text-slate-500">Account Created</p>
								<p className="text-slate-900 dark:text-white">
									{format(new Date(profileData?.createdAt || Date.now()), "PPP")}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
							<Calendar className="w-5 h-5 text-indigo-400" />
							<div className="flex-1">
								<p className="text-xs text-slate-500">Last Updated</p>
								<p className="text-slate-900 dark:text-white">
									{format(new Date(profileData?.updatedAt || Date.now()), "PPP")}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Security Settings */}
			<Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
				<CardHeader>
					<CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
						<Lock className="w-5 h-5 text-indigo-400" />
						Security Settings
					</CardTitle>
					<CardDescription className="text-slate-400">
						Manage your password and security preferences
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						onClick={() => setPasswordDialogOpen(true)}
						variant="outline"
						className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10"
					>
						<Lock className="w-4 h-4 mr-2" />
						Change Password
					</Button>
				</CardContent>
			</Card>

			{/* Edit Profile Dialog */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" aria-describedby="edit-profile-description">
					<DialogHeader>
						<DialogTitle>Edit Profile</DialogTitle>
						<DialogDescription id="edit-profile-description" className="text-slate-400">
							Update your profile information like name and phone number.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="edit-name">Full Name</Label>
							<Input
								id="edit-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-phone">Phone Number</Label>
							<Input
								id="edit-phone"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={handleUpdateProfile}
							disabled={updateProfileMutation.isPending}
							className="bg-indigo-600 hover:bg-indigo-700"
						>
							{updateProfileMutation.isPending && (
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							)}
							Save Changes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Change Password Dialog */}
			<Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
				<DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" aria-describedby="change-password-description">
					<DialogHeader>
						<DialogTitle>Change Password</DialogTitle>
						<DialogDescription id="change-password-description" className="text-slate-400">
							Enter your current password and a new secure password to update your account access.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="current-password">Current Password</Label>
							<Input
								id="current-password"
								type="password"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="new-password">New Password</Label>
							<Input
								id="new-password"
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirm-password">Confirm New Password</Label>
							<Input
								id="confirm-password"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={handleUpdatePassword}
							disabled={updatePasswordMutation.isPending}
							className="bg-indigo-600 hover:bg-indigo-700"
						>
							{updatePasswordMutation.isPending && (
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							)}
							Update Password
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
