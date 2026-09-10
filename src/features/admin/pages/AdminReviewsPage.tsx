import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, Search, Star, MessageSquare, Check, X, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import StarRating from "@/components/product/StarRating";

interface Review {
    id: string;
    rating: number;
    reviewText: string;
    profileImageUrl?: string;
    name: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: string;
    product: {
        name: string;
        images: string[];
    };
}

const AdminReviewsPage = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getAllReviews();
            setReviews(response.data.data);
        } catch (error) {
            console.error("Failed to fetch reviews", error);
            toast({
                title: "Error",
                description: "Failed to load reviews",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await adminAPI.updateReviewStatus(id, status);
            toast({
                title: "Success",
                description: `Review marked as ${status}`,
            });
            fetchReviews();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update status",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return;
        try {
            await adminAPI.deleteReview(id);
            toast({
                title: "Success",
                description: "Review deleted",
            });
            fetchReviews();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete review",
                variant: "destructive",
            });
        }
    };

    const filteredReviews = reviews.filter(review =>
        review.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.reviewText.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                        Customer Reviews
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Manage and moderate customer feedback
                    </p>
                </div>
                
                {/* Stats Cards could go here */}
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search reviews..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg shadow-sm bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Product</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead className="w-[30%]">Review</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Loading reviews...
                                </TableCell>
                            </TableRow>
                        ) : filteredReviews.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                                    No reviews found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredReviews.map((review) => (
                                <TableRow key={review.id} className="hover:bg-muted/50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {review.product.images?.[0] && (
                                                <img 
                                                    src={review.product.images[0]} 
                                                    alt={review.product.name} 
                                                    className="w-10 h-10 rounded object-cover border"
                                                />
                                            )}
                                            <span className="font-medium text-sm line-clamp-2 max-w-[150px]" title={review.product.name}>
                                                {review.product.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                {review.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium">{review.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StarRating value={review.rating} readonly size={14} showValue={false} />
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm text-muted-foreground line-clamp-2" title={review.reviewText}>
                                            {review.reviewText}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={
                                                review.status === 'APPROVED' ? 'default' : 
                                                review.status === 'REJECTED' ? 'destructive' : 'secondary'
                                            }
                                            className={
                                                review.status === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : ''
                                            }
                                        >
                                            {review.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {format(new Date(review.createdAt), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                {review.status !== 'APPROVED' && (
                                                    <DropdownMenuItem onClick={() => handleStatusUpdate(review.id, 'APPROVED')}>
                                                        <Check className="mr-2 h-4 w-4 text-green-600" />
                                                        Approve
                                                    </DropdownMenuItem>
                                                )}
                                                {review.status !== 'REJECTED' && (
                                                    <DropdownMenuItem onClick={() => handleStatusUpdate(review.id, 'REJECTED')}>
                                                        <X className="mr-2 h-4 w-4 text-red-600" />
                                                        Reject
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => handleDelete(review.id)} className="text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AdminReviewsPage;
